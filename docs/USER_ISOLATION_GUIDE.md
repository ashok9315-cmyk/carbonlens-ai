# User Data Isolation Implementation Guide

## 🔐 **Current Challenge**
The CarbonLens AI application currently stores all data in a shared database without user authentication, meaning all users see the same dashboard data including test data.

## 🎯 **Solution Options**

### **Option 1: Session-Based Isolation (Simple)**

#### **Implementation:**
1. **Generate Session IDs**
   ```javascript
   // In frontend - generate unique session ID
   const sessionId = localStorage.getItem('carbonlens-session') || 
                    crypto.randomUUID();
   localStorage.setItem('carbonlens-session', sessionId);
   ```

2. **Modify Data Storage**
   ```javascript
   // Add sessionId to all DynamoDB records
   const documentRecord = {
     TableName: tableName,
     Item: {
       id: { S: documentId },
       sessionId: { S: sessionId }, // Add this field
       type: { S: 'document-processing' },
       // ... rest of the data
     }
   };
   ```

3. **Filter Dashboard Queries**
   ```javascript
   // In dashboardData.js - filter by session
   const scanCommand = new ScanCommand({
     TableName: process.env.TABLE_NAME,
     FilterExpression: 'sessionId = :sessionId',
     ExpressionAttributeValues: {
       ':sessionId': { S: userSessionId }
     }
   });
   ```

#### **Pros:**
- Simple to implement
- No authentication required
- Each browser session sees only its data

#### **Cons:**
- Data lost if user clears browser storage
- No cross-device synchronization
- Not suitable for production use

---

### **Option 2: AWS Cognito Authentication (Recommended)**

#### **Implementation Steps:**

1. **Add Cognito User Pool**
   ```yaml
   # In cloudformation.yml
   CognitoUserPool:
     Type: AWS::Cognito::UserPool
     Properties:
       UserPoolName: carbonlens-users
       AutoVerifiedAttributes:
         - email
       Policies:
         PasswordPolicy:
           MinimumLength: 8
   ```

2. **Modify Frontend for Authentication**
   ```javascript
   // Install AWS Amplify Auth
   npm install @aws-amplify/auth
   
   // Configure authentication
   import { Auth } from '@aws-amplify/auth';
   
   const signIn = async (email, password) => {
     const user = await Auth.signIn(email, password);
     return user;
   };
   ```

3. **Add User ID to Data Records**
   ```javascript
   // Extract user ID from JWT token
   const token = event.headers.Authorization;
   const decoded = jwt.decode(token);
   const userId = decoded.sub;
   
   // Add to all database records
   Item: {
     id: { S: documentId },
     userId: { S: userId }, // User-specific data
     type: { S: 'document-processing' },
     // ... rest of data
   }
   ```

4. **Secure API Endpoints**
   ```yaml
   # In serverless.yml
   functions:
     processDocument:
       handler: src/handlers/documentProcessor.handler
       events:
         - http:
             path: /process-document
             method: post
             cors: true
             authorizer:
               type: COGNITO_USER_POOLS
               authorizerId: !Ref ApiGatewayAuthorizer
   ```

#### **Pros:**
- Secure user authentication
- Cross-device data synchronization
- Production-ready
- Integrates with AWS ecosystem

#### **Cons:**
- More complex implementation
- Requires user registration/login
- Additional AWS costs (minimal)

---

### **Option 3: Demo Mode with Data Separation**

#### **Implementation:**
1. **Add Demo Flag to Records**
   ```javascript
   // Mark test data as demo
   Item: {
     id: { S: documentId },
     isDemo: { S: 'true' }, // Flag for demo data
     type: { S: 'document-processing' },
     // ... rest of data
   }
   ```

2. **Dashboard Toggle**
   ```javascript
   // Allow users to toggle demo data visibility
   const [showDemoData, setShowDemoData] = useState(true);
   
   // Filter data in dashboard
   const filteredData = showDemoData ? 
     allData : 
     allData.filter(item => !item.isDemo);
   ```

3. **Clear Demo Data Option**
   ```javascript
   // Admin function to clear demo data
   const clearDemoData = async () => {
     // Delete all records where isDemo = 'true'
   };
   ```

---

## 🚀 **Quick Implementation: Demo Mode (Recommended for Now)**

Since this is an MVP/demo application, the simplest approach is to:

1. **Label the current state as "Demo Mode"** ✅ *Already implemented above*
2. **Add a toggle to hide/show demo data**
3. **Provide clear documentation about the shared nature**

### **Add Demo Data Toggle:**

```javascript
// In Dashboard.js
const [showDemoData, setShowDemoData] = useState(true);

// Add toggle in dashboard header
<div className="demo-controls">
  <label>
    <input 
      type="checkbox" 
      checked={showDemoData}
      onChange={(e) => setShowDemoData(e.target.checked)}
    />
    Show demo data
  </label>
</div>
```

---

## 📊 **Current Data Breakdown**

Based on the dashboard API response, your database currently contains:
- **Test Data:** 8 sample documents with ~1,430 kg CO₂e
- **Real Data:** 7 actual user uploads
- **Total:** 15 documents shown to all users

---

## 💡 **Recommendation**

For your current MVP/demo purposes:

1. **Keep the demo notice** (already added above)
2. **Document the shared nature** in your user guide
3. **Consider implementing session-based isolation** if you want to demo user separation
4. **Plan for Cognito authentication** if moving to production

The current approach is perfect for demonstrating the application's capabilities while being transparent about the demo nature.