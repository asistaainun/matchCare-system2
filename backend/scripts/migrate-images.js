const fs = require('fs');
const path = require('path');
const csvToJson = require('csvtojson');

async function migrateImages() {
  try {
    // Paths
    const sourceDir = path.join(__dirname, '../../data/scraped-images');
    const targetDir = path.join(__dirname, '../public/images/products');
    const csvFile = path.join(__dirname, '../../data/final_corrected_matchcare_data.csv');
    
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Read CSV data
    const products = await csvToJson().fromFile(csvFile);
    console.log(`Processing ${products.length} products...`);
    
    let copiedCount = 0;
    let errorCount = 0;
    const errorLog = [];
    
    for (const product of products) {
      try {
        const localImagePath = product['Local Image Path'];
        
        if (!localImagePath) {
          console.log(`No image path for product: ${product['Product Name']}`);
          continue;
        }
        
        // Extract filename from path
        const filename = path.basename(localImagePath);
        const sourceFile = path.join(sourceDir, filename);
        const targetFile = path.join(targetDir, filename);
        
        // Check if source file exists
        if (fs.existsSync(sourceFile)) {
          // Copy file
          fs.copyFileSync(sourceFile, targetFile);
          copiedCount++;
          console.log(`✓ Copied: ${filename}`);
        } else {
          // Try alternative naming patterns
          const alternatives = [
            localImagePath,
            localImagePath.replace(/\s+/g, '_'),
            localImagePath.replace(/\s+/g, '-'),
            localImagePath.toLowerCase(),
            localImagePath.toLowerCase().replace(/\s+/g, '_'),
            localImagePath.toLowerCase().replace(/\s+/g, '-')
          ];
          
          let found = false;
          for (const alt of alternatives) {
            const altPath = path.join(sourceDir, alt);
            if (fs.existsSync(altPath)) {
              fs.copyFileSync(altPath, targetFile);
              copiedCount++;
              console.log(`✓ Found alternative and copied: ${alt} -> ${filename}`);
              found = true;
              break;
            }
          }
          
          if (!found) {
            errorCount++;
            errorLog.push({
              product: product['Product Name'],
              imagePath: localImagePath,
              filename: filename
            });
            console.log(`✗ Not found: ${filename} for ${product['Product Name']}`);
          }
        }
      } catch (error) {
        errorCount++;
        errorLog.push({
          product: product['Product Name'],
          error: error.message
        });
        console.error(`Error processing ${product['Product Name']}:`, error.message);
      }
    }
    
    // Generate optimized filenames
    console.log('\nGenerating image mapping...');
    await generateImageMapping(products, targetDir);
    
    // Summary
    console.log('\n=== Migration Summary ===');
    console.log(`Total products: ${products.length}`);
    console.log(`Images copied: ${copiedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (errorLog.length > 0) {
      console.log('\n=== Error Details ===');
      fs.writeFileSync(
        path.join(__dirname, '../logs/image-migration-errors.json'),
        JSON.stringify(errorLog, null, 2)
      );
      console.log('Error details saved to: backend/logs/image-migration-errors.json');
    }
    
    console.log('\nImage migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

async function generateImageMapping(products, targetDir) {
  const mapping = {};
  const availableImages = fs.readdirSync(targetDir);
  
  for (const product of products) {
    const productId = generateProductId(product['Product Name'], product.Brand);
    const localImagePath = product['Local Image Path'];
    
    if (localImagePath) {
      const filename = path.basename(localImagePath);
      
      if (availableImages.includes(filename)) {
        mapping[productId] = `/images/products/${filename}`;
      } else {
        // Try to find similar files
        const similarFile = findSimilarFile(filename, availableImages);
        if (similarFile) {
          mapping[productId] = `/images/products/${similarFile}`;
        } else {
          mapping[productId] = '/images/placeholders/product-placeholder.jpg';
        }
      }
    } else {
      mapping[productId] = '/images/placeholders/product-placeholder.jpg';
    }
  }
  
  // Save mapping for reference
  fs.writeFileSync(
    path.join(__dirname, '../data/image-mapping.json'),
    JSON.stringify(mapping, null, 2)
  );
  
  console.log('Image mapping saved to: backend/data/image-mapping.json');
}

function generateProductId(name, brand) {
  return `${brand}_${name}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function findSimilarFile(targetFilename, availableFiles) {
  const target = targetFilename.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  for (const file of availableFiles) {
    const fileBase = file.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (fileBase.includes(target) || target.includes(fileBase)) {
      return file;
    }
  }
  
  return null;
}

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

migrateImages();