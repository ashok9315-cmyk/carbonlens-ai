const { DynamoDBClient, ScanCommand, UpdateItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function migrateUserData() {
  console.log('🔄 Starting user data migration...');
  
  const tableName = process.env.TABLE_NAME || 'carbonlens-ai-dev';
  
  try {
    // Scan all items
    const scanCommand = new ScanCommand({
      TableName: tableName
    });
    
    const result = await dynamoClient.send(scanCommand);
    const items = result.Items.map(item => unmarshall(item));
    
    console.log(`📊 Found ${items.length} total items`);
    
    // Categorize items
    const noUserIdItems = items.filter(item => !item.userId);
    const testUserItems = items.filter(item => item.userId === 'test-user');
    const realUserItems = items.filter(item => item.userId && item.userId !== 'test-user');
    
    console.log(`📋 Breakdown:`);
    console.log(`   - No userId: ${noUserIdItems.length}`);
    console.log(`   - Test user: ${testUserItems.length}`);
    console.log(`   - Real users: ${realUserItems.length}`);
    
    // Identify Ashok's real documents vs old test data
    const ashokRealFiles = [
      'Invoice-QWZQHFU8-0001.pdf',
      '1309 (1).PDF',
      'invoice.pdf',
      'test-invoice.pdf'
    ];
    
    let updatedCount = 0;
    let deletedCount = 0;
    
    for (const item of noUserIdItems) {
      const fileName = item.fileName || '';
      
      // Check if this is Ashok's real data
      const isAshokData = ashokRealFiles.some(realFile => 
        fileName.includes(realFile) || 
        fileName.toLowerCase().includes('invoice-qwzqhfu8') ||
        fileName.includes('1309')
      );
      
      if (isAshokData) {
        // Update to assign to Ashok
        console.log(`✅ Assigning to Ashok: ${fileName}`);
        
        const updateCommand = new UpdateItemCommand({
          TableName: tableName,
          Key: {
            id: { S: item.id },
            type: { S: item.type }
          },
          UpdateExpression: 'SET userId = :userId',
          ExpressionAttributeValues: {
            ':userId': { S: 'ashok9315@gmail.com' }
          }
        });
        
        await dynamoClient.send(updateCommand);
        updatedCount++;
        
      } else {
        // This is likely old test data - delete it
        console.log(`🗑️ Deleting old test data: ${fileName || item.type || item.id}`);
        
        const deleteCommand = new DeleteItemCommand({
          TableName: tableName,
          Key: {
            id: { S: item.id },
            type: { S: item.type }
          }
        });
        
        await dynamoClient.send(deleteCommand);
        deletedCount++;
      }
    }
    
    console.log(`✨ Migration complete!`);
    console.log(`   - Updated ${updatedCount} items for Ashok`);
    console.log(`   - Deleted ${deletedCount} old test items`);
    console.log(`   - Kept ${testUserItems.length} test-user items`);
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Export for use as a module or run directly
if (require.main === module) {
  migrateUserData()
    .then(() => {
      console.log('🎉 User data migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to migrate user data:', error);
      process.exit(1);
    });
}

module.exports = { migrateUserData };