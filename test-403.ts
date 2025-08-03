import { Warframe } from './warframe';

async function test403Issue() {
  console.log('Starting 403 error test...');
  
  const warframe = new Warframe();
  
  try {
    console.log('Testing getWarframeItems...');
    const items = await warframe.getWarframeItems();
    console.log('✅ Success! Got', items.payload?.items?.length || 0, 'items');
  } catch (error) {
    console.error('❌ Error in getWarframeItems:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers sent:', error.config?.headers);
    console.error('Proxy used:', error.config?.httpAgent?.proxy || 'No proxy info');
  }

  // Test a single item
  try {
    console.log('\nTesting getSingleItemData...');
    const singleItem = await warframe.getSingleItemData({ url_name: 'ash_prime_set' } as any);
    console.log('✅ Success! Got single item data');
  } catch (error) {
    console.error('❌ Error in getSingleItemData:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers sent:', error.config?.headers);
  }
}

test403Issue().catch(console.error);
