# CarbonLens AI - Complete User Guide

## 🌱 Welcome to CarbonLens AI

CarbonLens AI is your intelligent partner for supply chain carbon footprint tracking. This comprehensive guide will help you master all features and maximize your environmental impact reduction.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Document Upload & Processing](#document-upload--processing)
4. [Carbon Analysis](#carbon-analysis)
5. [AI Optimization Recommendations](#ai-optimization-recommendations)
6. [Certificate Management](#certificate-management)
7. [Advanced Features](#advanced-features)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [FAQ](#frequently-asked-questions)

---

## 🚀 Getting Started

### **Accessing CarbonLens AI**

1. **Visit the Application**
   - Open your web browser
   - Navigate to: https://carbonlens-ai.solutionsynth.cloud
   - Backup URL: https://d1dqupktcu8kce.cloudfront.net
   - The application works on desktop, tablet, and mobile devices

2. **Create Your Account**
   - Click "Create Account" on the login screen
   - Enter your email address
   - Create a secure password (minimum 8 characters with uppercase, lowercase, and numbers)
   - Verify your email address through the confirmation link

3. **Sign In**
   - Enter your email and password
   - Click "Sign In"
   - You'll be redirected to the main dashboard

### **First-Time Setup**

After signing in for the first time:

1. **Complete Your Profile**
   - Add your company information
   - Set your preferred units (metric/imperial)
   - Configure notification preferences

2. **Explore the Interface**
   - Familiarize yourself with the navigation sidebar
   - Review the dashboard overview
   - Check out the help tooltips throughout the application

---

## 📊 Dashboard Overview

The dashboard is your command center for carbon footprint management.

### **Key Metrics Section**

**🌱 Total Emissions**
- Displays your cumulative carbon footprint
- Shows percentage change from previous period
- Color-coded indicators (green = improvement, red = increase)

**📄 Documents Processed**
- Number of logistics documents analyzed
- Processing success rate
- Recent activity indicator

**⚡ Optimizations**
- Active optimization recommendations
- Potential emission reduction percentage
- Implementation status tracking

**🏆 Certificates**
- Number of carbon certificates generated
- Verification status
- Compliance tracking

### **Analytics Visualizations**

**📈 Emissions Trend Chart**
- Monthly emission trends over time
- Interactive hover for detailed data
- Zoom functionality for specific periods

**🥧 Emissions by Transport Mode**
- Pie chart showing emission breakdown
- Percentage distribution by transport type
- Click segments for detailed analysis

### **Recent Activities Feed**

- Real-time updates on document processing
- Carbon calculation completions
- Optimization recommendations generated
- Certificate issuance notifications

---

## 📄 Document Upload & Processing

Transform your logistics documents into actionable carbon insights.

### **Supported Document Types**

**✅ Invoices**
- Shipping invoices with logistics details
- Commercial invoices with transport information
- Freight invoices from carriers

**✅ Bills of Lading**
- Ocean freight bills of lading
- Air waybills
- Truck bills of lading

**✅ Shipping Labels**
- Carrier shipping labels (FedEx, UPS, DHL, etc.)
- Freight labels with weight and destination
- Express delivery labels

**✅ Transport Documents**
- Freight receipts
- Delivery confirmations
- Transport manifests

### **Upload Process**

#### **Method 1: Drag & Drop**
1. Navigate to "Upload Documents" in the sidebar
2. Drag your document files into the upload area
3. Files will automatically begin processing
4. Monitor progress with the real-time progress bar

#### **Method 2: File Browser**
1. Click "browse files" in the upload area
2. Select one or multiple files (Ctrl+click for multiple)
3. Click "Open" to start upload
4. Processing begins automatically

### **File Requirements**

**📋 Supported Formats**
- PDF documents (up to 10MB)
- PNG images (up to 10MB)
- JPG/JPEG images (up to 10MB)

**⚡ Processing Time**
- Small documents (< 1MB): 10-30 seconds
- Medium documents (1-5MB): 30-60 seconds
- Large documents (5-10MB): 1-2 minutes

### **AI Processing Pipeline**

**🔍 Step 1: Text Extraction**
- Amazon Textract extracts all text content
- OCR technology handles scanned documents
- Maintains original formatting and structure

**🧠 Step 2: Content Analysis**
- Amazon Comprehend identifies key entities
- Extracts shipping origins and destinations
- Identifies transport modes and carriers

**📊 Step 3: Data Extraction**
- Parses logistics-specific information
- Extracts weights, distances, and routes
- Identifies product details and quantities

**✅ Step 4: Validation**
- Validates extracted data for accuracy
- Flags potential errors or missing information
- Provides confidence scores for extracted data

### **Extracted Information Display**

After processing, you'll see:

**📍 Route Information**
- Origin location (city, country)
- Destination location (city, country)
- Calculated distance (if not specified)

**🚛 Transport Details**
- Transport mode (truck, rail, ship, air)
- Carrier information (if available)
- Service type (express, standard, freight)

**📦 Shipment Details**
- Weight (converted to kg)
- Dimensions (if available)
- Product categories

**🔧 Processing Actions**
- Edit extracted information if needed
- Proceed to carbon calculation
- Save for later processing

---

## 🌱 Carbon Analysis

Understand your supply chain's environmental impact with detailed carbon footprint analysis.

### **Accessing Carbon Analysis**

1. Click "Carbon Analysis" in the sidebar
2. View your recent calculations
3. Select a calculation for detailed analysis
4. Explore interactive visualizations

### **Carbon Footprint Breakdown**

**🚛 Transport Emissions**
- Direct emissions from transportation
- Calculated using IPCC emission factors
- Varies by transport mode and distance

**🏭 Manufacturing Emissions**
- Estimated production-related emissions
- Based on product categories and weights
- Includes packaging and processing

**🏢 Warehousing Emissions**
- Storage and handling emissions
- Includes refrigeration and lighting
- Calculated based on storage duration

**🚚 Last-Mile Delivery**
- Final delivery to destination
- Includes local distribution centers
- Accounts for delivery density

### **Emission Factors Used**

| Transport Mode | Emission Factor (kg CO₂/ton-km) |
|----------------|--------------------------------|
| Truck          | 0.062                         |
| Rail           | 0.022                         |
| Ship/Ocean     | 0.008                         |
| Air Freight    | 0.602                         |

### **Interactive Analysis Features**

**📊 Visual Breakdown**
- Color-coded emission categories
- Percentage distribution charts
- Comparative analysis tools

**🔍 Detailed Metrics**
- Total carbon footprint (kg CO₂e)
- Per-unit emissions
- Emission intensity ratios

**📈 Trend Analysis**
- Historical emission trends
- Seasonal pattern identification
- Performance benchmarking

**🎯 Benchmarking**
- Industry average comparisons
- Best-in-class benchmarks
- Improvement opportunity identification

### **AI Insights Integration**

**🤖 Amazon Bedrock Analysis**
- Contextual insights about your emissions
- Industry-specific recommendations
- Sustainability scoring (1-10 scale)

**📋 Key Insights Examples**
- "Your air freight usage is 40% above industry average"
- "Switching to ocean freight could reduce emissions by 85%"
- "Your last-mile delivery efficiency is excellent"

---

## ⚡ AI Optimization Recommendations

Leverage artificial intelligence to reduce your carbon footprint with actionable recommendations.

### **Accessing Optimizations**

1. Navigate to "Optimizations" in the sidebar
2. View your personalized recommendations
3. Filter by category or implementation difficulty
4. Track implementation progress

### **Recommendation Categories**

#### **🗺️ Route Optimization**

**AI-Powered Route Planning**
- **Action**: Implement dynamic route optimization
- **Potential Reduction**: 15-25%
- **Implementation**: 2-4 weeks
- **Difficulty**: Medium
- **Cost Impact**: Savings

**Shipment Consolidation**
- **Action**: Combine multiple small shipments
- **Potential Reduction**: 20-30%
- **Implementation**: 1-2 weeks
- **Difficulty**: Low
- **Cost Impact**: Savings

#### **🚛 Transport Mode Switching**

**Ocean vs Air Freight**
- **Action**: Switch non-urgent shipments to ocean freight
- **Potential Reduction**: 80-90%
- **Implementation**: 1-2 weeks
- **Difficulty**: Low
- **Cost Impact**: Savings

**Rail Transport Integration**
- **Action**: Use rail for long-distance domestic shipments
- **Potential Reduction**: 60-70%
- **Implementation**: 4-6 weeks
- **Difficulty**: Medium
- **Cost Impact**: Neutral

#### **📦 Consolidation Opportunities**

**Cross-Docking Implementation**
- **Action**: Direct transfer from inbound to outbound
- **Potential Reduction**: 10-15%
- **Implementation**: 8-12 weeks
- **Difficulty**: High
- **Cost Impact**: Initial investment required

#### **⏰ Timing Optimization**

**Off-Peak Scheduling**
- **Action**: Schedule shipments during off-peak hours
- **Potential Reduction**: 10-15%
- **Implementation**: 1 week
- **Difficulty**: Low
- **Cost Impact**: Neutral

### **Implementation Tracking**

**📋 Recommendation Status**
- **Not Started**: Recommendation identified
- **In Progress**: Implementation underway
- **Completed**: Successfully implemented
- **Deferred**: Postponed for later consideration

**📊 Impact Measurement**
- Track actual vs. predicted emission reductions
- Monitor cost savings achieved
- Measure implementation timeline accuracy

### **Quick Wins vs Long-Term Goals**

**🚀 Quick Wins (1-4 weeks)**
- Shipment consolidation
- Off-peak scheduling
- Ocean freight switching
- Route optimization software

**🎯 Long-Term Goals (2-12 months)**
- Rail transport partnerships
- Cross-docking facilities
- Sustainable supplier network
- Advanced analytics implementation

---

## 🏆 Certificate Management

Generate and manage blockchain-verified carbon certificates for transparency and compliance.

### **Certificate Overview**

Carbon certificates provide:
- **Transparency**: Public verification of carbon claims
- **Compliance**: Meet regulatory requirements
- **Marketing**: Demonstrate sustainability commitment
- **Audit Trail**: Immutable record of carbon performance

### **Generating Certificates**

#### **Prerequisites**
- Completed carbon footprint calculation
- Product information (name, SKU, category)
- Company information (name, address, contact)

#### **Generation Process**
1. Navigate to "Certificates" section
2. Click "Generate New Certificate"
3. Select the carbon calculation to certify
4. Enter product details:
   - Product name and description
   - SKU or product identifier
   - Product category
5. Verify company information:
   - Company name
   - Business address
   - Contact information
6. Review and generate certificate

### **Certificate Components**

#### **📋 Header Information**
- Certificate ID (unique identifier)
- Issue date and validity period
- Certification standard (GHG Protocol)
- Verification status

#### **🏢 Company Details**
- Company name and address
- Contact information
- Business registration details

#### **📦 Product Information**
- Product name and SKU
- Product category
- Manufacturing details

#### **🌱 Carbon Footprint Data**
- Total emissions (kg CO₂e)
- Emission breakdown by category
- Calculation methodology
- Scope coverage (Scope 3 - Transportation)

#### **🛣️ Supply Chain Information**
- Origin and destination locations
- Transport modes used
- Distance traveled
- Weight transported

#### **🔐 Verification Details**
- Cryptographic hash (SHA-256)
- Digital signature
- Blockchain verification
- Timestamp information

### **Certificate Verification**

#### **QR Code System**
- Each certificate includes a unique QR code
- Scan with any smartphone camera
- Instantly verify certificate authenticity
- Access public verification page

#### **Public Verification**
- Visit verification URL
- Enter certificate ID
- View certificate details
- Confirm authenticity

#### **Blockchain Verification**
- Cryptographic hash validation
- Immutable audit trail
- Tamper-proof verification
- Decentralized validation

### **Certificate Management**

#### **📁 Certificate Library**
- View all generated certificates
- Search and filter capabilities
- Sort by date, product, or status
- Bulk operations support

#### **📤 Export Options**
- **PDF Download**: Print-ready certificate
- **JSON Export**: Machine-readable format
- **QR Code Image**: Standalone verification code
- **Verification Link**: Shareable URL

#### **🔄 Certificate Updates**
- Certificates are immutable once issued
- New calculations require new certificates
- Version tracking for product updates
- Historical certificate archive

### **Compliance Standards**

#### **🌍 GHG Protocol**
- World's most widely used greenhouse gas accounting standard
- Scope 1, 2, and 3 emission categories
- Corporate and product-level standards
- International recognition

#### **📊 ISO 14064**
- International standard for greenhouse gas accounting
- Verification and validation requirements
- Quality assurance protocols
- Global compliance framework

#### **📈 CDP Reporting**
- Carbon Disclosure Project compatibility
- Investor-grade reporting standards
- Supply chain transparency
- Climate risk assessment

---

## 🔧 Advanced Features

### **API Integration**

#### **REST API Access**
- Programmatic access to all features
- RESTful endpoints for integration
- JSON request/response format
- Authentication via JWT tokens

#### **Common API Use Cases**
- Automated document processing
- Bulk carbon calculations
- Integration with ERP systems
- Custom dashboard development

#### **API Documentation**
- Complete endpoint reference
- Request/response examples
- Authentication guide
- Rate limiting information

### **Data Export & Reporting**

#### **📊 Custom Reports**
- Generate detailed emission reports
- Customize date ranges and filters
- Include charts and visualizations
- Export to PDF or Excel

#### **📈 Analytics Dashboard**
- Advanced filtering options
- Custom date range selection
- Comparative analysis tools
- Trend identification

#### **🔄 Data Integration**
- Export data to external systems
- CSV and JSON format support
- Automated data synchronization
- Real-time API access

### **Notification System**

#### **📧 Email Notifications**
- Document processing completion
- Carbon calculation results
- Optimization recommendations
- Certificate generation alerts

#### **⚙️ Notification Preferences**
- Customize notification types
- Set frequency preferences
- Choose delivery methods
- Configure alert thresholds

### **Multi-User Support**

#### **👥 Team Collaboration**
- Multiple user accounts per organization
- Role-based access control
- Shared document libraries
- Collaborative analysis tools

#### **🔐 Permission Management**
- Admin, Editor, and Viewer roles
- Granular permission settings
- Audit trail for user actions
- Secure access controls

---

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **📄 Document Upload Problems**

**Issue**: "File format not supported"
- **Solution**: Ensure file is PDF, PNG, or JPG format
- **Check**: File size is under 10MB
- **Try**: Converting to supported format

**Issue**: "Upload failed"
- **Solution**: Check internet connection
- **Try**: Refresh page and retry upload
- **Contact**: Support if problem persists

**Issue**: "Processing taking too long"
- **Normal**: Large files can take 1-2 minutes
- **Check**: File size and complexity
- **Wait**: Allow up to 5 minutes for completion

#### **🔐 Authentication Issues**

**Issue**: "Cannot sign in"
- **Check**: Email and password are correct
- **Try**: Password reset if forgotten
- **Verify**: Email address is confirmed

**Issue**: "Session expired"
- **Solution**: Sign in again
- **Automatic**: Sessions refresh automatically
- **Security**: Sessions expire after inactivity

#### **📊 Data Display Problems**

**Issue**: "Charts not loading"
- **Solution**: Refresh the page
- **Check**: Internet connection stability
- **Try**: Different browser if needed

**Issue**: "Incorrect calculations"
- **Verify**: Input data accuracy
- **Check**: Units and measurements
- **Contact**: Support for calculation review

### **Performance Optimization**

#### **🚀 Faster Loading**
- Use modern browsers (Chrome, Firefox, Safari, Edge)
- Ensure stable internet connection
- Clear browser cache if needed
- Close unnecessary browser tabs

#### **📱 Mobile Usage**
- Use responsive design features
- Rotate device for better chart viewing
- Use touch gestures for navigation
- Enable mobile notifications

### **Browser Compatibility**

#### **✅ Supported Browsers**
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

#### **📱 Mobile Browsers**
- Chrome Mobile
- Safari Mobile
- Firefox Mobile
- Samsung Internet

### **Getting Help**

#### **📞 Support Channels**
- **In-App Help**: Click help icons throughout the application
- **Documentation**: Comprehensive guides and tutorials
- **FAQ**: Common questions and answers
- **Contact Form**: Direct support requests

#### **🔍 Self-Help Resources**
- Interactive tutorials
- Video demonstrations
- Best practices guides
- Community forums

---

## 💡 Best Practices

### **Document Management**

#### **📋 Preparation Tips**
- Ensure documents are clear and legible
- Include complete shipping information
- Use high-resolution scans for images
- Organize documents by date or project

#### **🗂️ Organization Strategy**
- Create consistent naming conventions
- Group related documents together
- Regular cleanup of processed documents
- Maintain backup copies of important documents

### **Carbon Tracking**

#### **📊 Regular Monitoring**
- Upload documents promptly after shipments
- Review carbon calculations monthly
- Track trends and patterns
- Set emission reduction targets

#### **🎯 Goal Setting**
- Establish baseline measurements
- Set realistic reduction targets
- Monitor progress regularly
- Celebrate achievements

### **Optimization Implementation**

#### **⚡ Quick Wins First**
- Start with low-difficulty recommendations
- Focus on high-impact, low-cost changes
- Implement multiple small improvements
- Build momentum with early successes

#### **📈 Long-Term Planning**
- Develop implementation roadmap
- Allocate resources for major changes
- Plan for infrastructure investments
- Consider supply chain partnerships

### **Certificate Usage**

#### **🏆 Marketing Integration**
- Include certificates in marketing materials
- Share QR codes with customers
- Highlight sustainability achievements
- Use in tender and proposal responses

#### **📋 Compliance Management**
- Maintain certificate archives
- Track expiration dates
- Plan renewal schedules
- Document compliance activities

---

## ❓ Frequently Asked Questions

### **General Questions**

**Q: What is CarbonLens AI?**
A: CarbonLens AI is an intelligent platform that automatically tracks and analyzes the carbon footprint of products throughout their supply chain journey using AI-powered document processing and analysis.

**Q: How accurate are the carbon calculations?**
A: Our calculations use industry-standard emission factors from IPCC and EPA guidelines, providing accuracy comparable to professional carbon accounting services.

**Q: Is my data secure?**
A: Yes, we use enterprise-grade security including encryption at rest and in transit, secure authentication, and AWS security best practices.

### **Technical Questions**

**Q: What file formats are supported?**
A: We support PDF, PNG, JPG, and JPEG files up to 10MB in size.

**Q: How long does document processing take?**
A: Processing typically takes 10 seconds to 2 minutes depending on document size and complexity.

**Q: Can I integrate with my existing systems?**
A: Yes, we provide REST APIs for integration with ERP systems, custom applications, and third-party tools.

### **Pricing & Billing**

**Q: How much does CarbonLens AI cost?**
A: The application runs on AWS Free Tier, making it virtually free for the first year. After that, costs are minimal (typically $0.05-0.15/month for light usage).

**Q: Are there usage limits?**
A: Free Tier includes generous limits that accommodate most small to medium business needs. See our pricing page for detailed limits.

**Q: Can I upgrade for higher usage?**
A: Yes, the serverless architecture automatically scales with your usage, and you only pay for what you use.

### **Features & Functionality**

**Q: What transport modes are supported?**
A: We support truck, rail, ship/ocean, air freight, and ground delivery with specific emission factors for each mode.

**Q: Can I edit extracted information?**
A: Yes, you can review and edit all extracted information before proceeding with carbon calculations.

**Q: How do I verify certificates?**
A: Each certificate includes a QR code that links to a public verification page where anyone can confirm authenticity.

### **Support & Training**

**Q: Is training available?**
A: Yes, we provide comprehensive documentation, video tutorials, and in-app guidance to help you get started quickly.

**Q: How do I get support?**
A: Support is available through in-app help, documentation, and direct contact forms for technical assistance.

**Q: Can I request new features?**
A: Absolutely! We welcome feature requests and user feedback to continuously improve the platform.

---

## 📞 Contact & Support

### **Getting Help**
- **Documentation**: Comprehensive guides and tutorials
- **In-App Support**: Help tooltips and guidance throughout the application
- **Video Tutorials**: Step-by-step video demonstrations
- **FAQ Section**: Common questions and detailed answers

### **Technical Support**
- **Response Time**: Within 24 hours for technical issues
- **Coverage**: Monday-Friday, 9 AM - 5 PM EST
- **Languages**: English (primary), with multilingual support planned

### **Feature Requests**
- **Feedback Portal**: Submit suggestions and vote on features
- **User Community**: Connect with other users and share best practices
- **Product Roadmap**: View upcoming features and improvements

---

## 🎯 Success Tips

### **Getting Started Successfully**
1. **Start Small**: Begin with a few documents to familiarize yourself
2. **Explore Features**: Try each section to understand capabilities
3. **Set Goals**: Establish baseline measurements and reduction targets
4. **Regular Usage**: Make carbon tracking part of your routine workflow

### **Maximizing Impact**
1. **Implement Quick Wins**: Start with easy, high-impact optimizations
2. **Track Progress**: Monitor trends and celebrate improvements
3. **Share Results**: Use certificates and reports to demonstrate progress
4. **Continuous Improvement**: Regularly review and optimize your processes

### **Advanced Usage**
1. **API Integration**: Connect with existing business systems
2. **Team Collaboration**: Involve multiple stakeholders in carbon management
3. **Compliance Reporting**: Use certificates for regulatory compliance
4. **Supply Chain Engagement**: Share insights with suppliers and partners

---

*Welcome to the future of intelligent carbon management. With CarbonLens AI, you have the tools to make a real environmental impact while improving your business operations. Start your sustainability journey today!*

---

**Application URL**: https://carbonlens-ai.solutionsynth.cloud

**Last Updated**: December 30, 2024  
**Version**: 1.0.0