import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, render_template
from flask_cors import CORS
from src.models.inventory import db
from src.database_init import init_database
from src.routes.stock import stock_bp
from src.routes.employee import employee_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes
CORS(app)

# Register blueprints
app.register_blueprint(stock_bp, url_prefix='/api')
app.register_blueprint(employee_bp, url_prefix='/api')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Initialize database
with app.app_context():
    init_database()

@app.route('/')
def serve():
    
    return render_template('index.html')

@app.route('/icard')
def icard():
    return render_template('icard.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
