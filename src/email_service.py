import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "inventory@company.com"  # This would need to be configured
SENDER_PASSWORD = "your_app_password"   # This would need to be configured
RECIPIENT_EMAIL = "bansrijiyani07@gmail.com"

def send_low_stock_alert(low_stock_items):
    """Send email alert for low stock items"""
    try:
        # For demo purposes, we'll just print the alert
        # In production, you would configure actual SMTP settings
        
        print("=" * 50)
        print("LOW STOCK ALERT EMAIL")
        print("=" * 50)
        print(f"To: {RECIPIENT_EMAIL}")
        print(f"From: Inventory Management System")
        print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Subject: Low Stock Alert - Immediate Action Required")
        print()
        print("Dear Inventory Manager,")
        print()
        print("This is an automated alert to inform you that the following items are running low in stock:")
        print()
        
        for item in low_stock_items:
            print(f"• {item['name']}: {item['quantity']} remaining (Danger level: {item['danger_level']})")
        
        print()
        print("Please update the stock as soon as possible to ensure smooth operations.")
        print("Items below the danger level of 30 units require immediate attention.")
        print()
        print("Best regards,")
        print("Inventory Management System")
        print("=" * 50)
        
        # Create email content for actual sending (commented out for demo)
        email_content = create_email_content(low_stock_items)
        
        # Uncomment below for actual email sending
        # send_actual_email(email_content)
        
        return True
    except Exception as e:
        print(f"Error sending low stock alert: {e}")
        return False

def create_email_content(low_stock_items):
    """Create HTML email content for low stock alert"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            .header {{ background-color: #f44336; color: white; padding: 15px; text-align: center; }}
            .content {{ padding: 20px; }}
            .item-list {{ background-color: #f9f9f9; padding: 15px; margin: 10px 0; }}
            .item {{ margin: 5px 0; padding: 8px; background-color: white; border-left: 4px solid #f44336; }}
            .footer {{ margin-top: 20px; padding: 15px; background-color: #f0f0f0; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h2>🚨 LOW STOCK ALERT</h2>
            <p>Immediate Action Required</p>
        </div>
        
        <div class="content">
            <p>Dear Inventory Manager,</p>
            
            <p>This is an automated alert to inform you that the following items are running low in stock and require immediate attention:</p>
            
            <div class="item-list">
                <h3>Items Below Danger Level:</h3>
    """
    
    for item in low_stock_items:
        html_content += f"""
                <div class="item">
                    <strong>{item['name']}</strong>: {item['quantity']} remaining 
                    (Danger level: {item['danger_level']})
                </div>
        """
    
    html_content += f"""
            </div>
            
            <p><strong>Action Required:</strong></p>
            <ul>
                <li>Please update the stock as soon as possible</li>
                <li>Items below 30 units require immediate restocking</li>
                <li>Contact suppliers for urgent delivery if needed</li>
            </ul>
            
            <p>This alert was generated on {datetime.now().strftime('%Y-%m-%d at %H:%M:%S')}</p>
        </div>
        
        <div class="footer">
            <p><strong>Best regards,</strong><br>
            Inventory Management System<br>
            Automated Alert Service</p>
        </div>
    </body>
    </html>
    """
    
    return html_content

def send_actual_email(html_content):
    """Send actual email (requires SMTP configuration)"""
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Low Stock Alert - Immediate Action Required"
        msg['From'] = SENDER_EMAIL
        msg['To'] = RECIPIENT_EMAIL
        
        # Create HTML part
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        text = msg.as_string()
        server.sendmail(SENDER_EMAIL, RECIPIENT_EMAIL, text)
        server.quit()
        
        print(f"Low stock alert email sent successfully to {RECIPIENT_EMAIL}")
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def test_email_service():
    """Test the email service with sample data"""
    test_low_stock = [
        {'name': 'bag', 'quantity': 25, 'danger_level': 30},
        {'name': 'pen', 'quantity': 15, 'danger_level': 30},
        {'name': 'tshirt (M)', 'quantity': 20, 'danger_level': 30}
    ]
    
    return send_low_stock_alert(test_low_stock)

