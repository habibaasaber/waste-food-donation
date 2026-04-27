import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from config import Config
from models import db, User, Donation, Notification, Review
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)
db.init_app(app)

with app.app_context():
    db.create_all()

jwt = JWTManager(app)

# Azure Blob Mock Logic or actual Azure Blob implementation
from azure.storage.blob import BlobServiceClient
import uuid

def upload_to_azure(file_stream, filename):
    try:
        connection_string = app.config['AZURE_STORAGE_CONNECTION_STRING']
        if not connection_string:
            print("WARNING: Creating local mocked image, no Azure Storage connection string.")
            return mock_upload_to_local(file_stream, filename)
            
        blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        container_name = app.config['AZURE_CONTAINER_NAME']
        
        container_client = blob_service_client.get_container_client(container_name)
        if not container_client.exists():
            container_client.create_container()
            
        unique_name = f"{uuid.uuid4()}-{secure_filename(filename)}"
        blob_client = blob_service_client.get_blob_client(container=container_name, blob=unique_name)
        
        blob_client.upload_blob(file_stream, overwrite=True)
        return blob_client.url
    except Exception as e:
        print(f"Azure Upload Error: {e}")
        return mock_upload_to_local(file_stream, filename)

def mock_upload_to_local(file_stream, filename):
    os.makedirs('static/uploads', exist_ok=True)
    unique_name = f"{uuid.uuid4()}-{secure_filename(filename)}"
    path = os.path.join('static', 'uploads', unique_name)
    with open(path, 'wb') as f:
        f.write(file_stream.read())
    return f"http://127.0.0.1:5000/static/uploads/{unique_name}"

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Waste Food Donation API V1"}), 200

# Auth Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')
    
    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "Username already exists"}), 400
        
    if role not in ['donor', 'receiver', 'admin']:
        role = 'donor'
        
    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password=hashed_password, role=role)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"msg": "User created successfully"}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"msg": "Bad username or password"}), 401
    
    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "access_token": access_token, 
        "user": {"id": user.id, "username": user.username, "role": user.role}
    }), 200

# Donation Routes
@app.route('/api/donations', methods=['POST'])
@jwt_required()
def create_donation():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if user.role != 'donor':
        return jsonify({"msg": "Only donors can add donations"}), 403
        
    title = request.form.get('title')
    description = request.form.get('description')
    quantity = request.form.get('quantity')
    location = request.form.get('location')
    latitude = request.form.get('latitude')
    longitude = request.form.get('longitude')
    expiry_date_str = request.form.get('expiry_date')
    is_safe = request.form.get('is_safe') == 'true'
    
    expiry_date = None
    if expiry_date_str:
        try:
            from datetime import datetime
            expiry_date = datetime.fromisoformat(expiry_date_str.replace('Z', '+00:00'))
        except:
            pass
    
    if not is_safe:
        return jsonify({"msg": "You must confirm the food is safe"}), 400
    
    image_url = None
    if 'image' in request.files:
        file = request.files['image']
        if file.filename != '':
            image_url = upload_to_azure(file, file.filename)
            
    donation = Donation(
        title=title,
        description=description,
        quantity=quantity,
        location=location,
        latitude=latitude if latitude else None,
        longitude=longitude if longitude else None,
        expiry_date=expiry_date,
        is_safe=is_safe,
        image_url=image_url,
        donor_id=current_user_id
    )
    
    db.session.add(donation)
    db.session.commit()
    
    return jsonify({"msg": "Donation created successfully", "id": donation.id}), 201

@app.route('/api/donations', methods=['GET'])
def get_donations():
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    
    query = Donation.query
    if search:
        query = query.filter(Donation.title.ilike(f'%{search}%') | Donation.description.ilike(f'%{search}%'))
    if status:
        query = query.filter(Donation.status == status)
        
    donations = query.order_by(Donation.created_at.desc()).all()
    
    result = []
    for d in donations:
        result.append({
            "id": d.id,
            "title": d.title,
            "description": d.description,
            "quantity": d.quantity,
            "location": d.location,
            "latitude": d.latitude,
            "longitude": d.longitude,
            "expiry_date": d.expiry_date.isoformat() if d.expiry_date else None,
            "is_safe": d.is_safe,
            "image_url": d.image_url,
            "status": d.status,
            "created_at": d.created_at.isoformat(),
            "donor": {"username": d.donor.username}
        })
        
    return jsonify(result), 200

@app.route('/api/donations/<int:donation_id>/request', methods=['POST'])
@jwt_required()
def request_donation(donation_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'receiver':
        return jsonify({"msg": "Only receivers can request donations"}), 403
        
    donation = Donation.query.get_or_404(donation_id)
    if donation.status != 'available':
        return jsonify({"msg": "Donation is not available"}), 400
        
    donation.status = 'requested'
    
    # Generate notification for donor
    notif = Notification(
        user_id=donation.donor_id, 
        title="Donation Requested", 
        message=f"{user.username} has requested your donation: {donation.title}."
    )
    db.session.add(notif)
    db.session.commit()
    
    return jsonify({"msg": "Donation requested successfully"}), 200

@app.route('/api/donations/<int:donation_id>/complete', methods=['POST'])
@jwt_required()
def complete_donation(donation_id):
    current_user_id = int(get_jwt_identity())
    donation = Donation.query.get_or_404(donation_id)
    
    if donation.donor_id != current_user_id:
        return jsonify({"msg": "Only the original donor can mark this as completed"}), 403
        
    donation.status = 'completed'
    db.session.commit()
    return jsonify({"msg": "Donation marked as completed"}), 200

@app.route('/api/donations/<int:donation_id>/rate', methods=['POST'])
@jwt_required()
def rate_donation(donation_id):
    current_user_id = int(get_jwt_identity())
    donation = Donation.query.get_or_404(donation_id)
    
    if donation.status != 'completed':
        return jsonify({"msg": "Can only rate completed donations"}), 400
        
    data = request.get_json()
    rating = data.get('rating')
    comment = data.get('comment')
    
    if not rating or rating < 1 or rating > 5:
        return jsonify({"msg": "Rating must be between 1 and 5"}), 400
        
    review = Review(donation_id=donation_id, reviewer_id=current_user_id, rating=rating, comment=comment)
    db.session.add(review)
    db.session.commit()
    
    return jsonify({"msg": "Review submitted successfully"}), 201

@app.route('/api/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_id = int(get_jwt_identity())
    notifs = Notification.query.filter_by(user_id=current_user_id).order_by(Notification.created_at.desc()).all()
    
    res = []
    for n in notifs:
        res.append({
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        })
    return jsonify(res), 200

@app.route('/api/admin/donations/<int:donation_id>', methods=['DELETE'])
@jwt_required()
def delete_donation(donation_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if user.role != 'admin':
        return jsonify({"msg": "Admin access required"}), 403
        
    donation = Donation.query.get_or_404(donation_id)
    db.session.delete(donation)
    db.session.commit()
    return jsonify({"msg": "Donation removed successfully"}), 200

def init_db():
    with app.app_context():
        db.create_all()

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
