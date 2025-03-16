import { getSupabaseClient } from '../lib/supabase/client'

async function verifyDatabase() {
  const supabase = getSupabaseClient()
  
  console.log('Starting database verification...')
  
  try {
    // Test 1: Basic connection
    console.log('\nTest 1: Testing basic connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    
    if (connectionError) throw connectionError
    console.log('✅ Basic connection successful')

    // Test 2: Product Rankings
    console.log('\nTest 2: Testing product rankings function...')
    const { data: rankings, error: rankingsError } = await supabase
      .rpc('get_product_rankings')
    
    if (rankingsError) throw rankingsError
    console.log('✅ Product rankings function working')
    console.log(`Found ${rankings.length} products`)
    console.log('Sample product:', rankings[0])

    // Test 3: Product Details
    console.log('\nTest 3: Testing product details function...')
    if (rankings.length > 0) {
      const { data: details, error: detailsError } = await supabase
        .rpc('get_product_details', { p_slug: rankings[0].url_slug })
      
      if (detailsError) throw detailsError
      console.log('✅ Product details function working')
      console.log('Sample details:', {
        name: details.name,
        category: details.category,
        votes: details.votes,
        related_products: details.related_products
      })
    }

    // Test 4: Product Votes
    console.log('\nTest 4: Testing product votes...')
    const { data: votes, error: votesError } = await supabase
      .from('product_votes')
      .select('*')
      .limit(1)
    
    if (votesError) throw votesError
    console.log('✅ Product votes table accessible')
    
    console.log('\n✅ All database functions verified successfully!')
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error)
  }
}

verifyDatabase() 