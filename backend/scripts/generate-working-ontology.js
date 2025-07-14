const { Ingredient, Product } = require('../src/models');
const fs = require('fs').promises;

class WorkingOntologyGenerator {
  async generate() {
    console.log('🔄 Generating WORKING ontology with real data...');
    
    let ttl = `
@prefix : <http://www.semanticweb.org/msilaptop/ontologies/2025/4/skincareOntology/> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

# ===== SKIN TYPES =====
:Normal rdf:type :SkinType ; rdfs:label "Normal" .
:Dry rdf:type :SkinType ; rdfs:label "Dry" .
:Oily rdf:type :SkinType ; rdfs:label "Oily" .
:Combination rdf:type :SkinType ; rdfs:label "Combination" .

# ===== SKIN CONCERNS =====
:Acne rdf:type :SkinConcern ; rdfs:label "Acne" .
:Wrinkles rdf:type :SkinConcern ; rdfs:label "Wrinkles" .
:Dryness rdf:type :SkinConcern ; rdfs:label "Dryness" .
:Oiliness rdf:type :SkinConcern ; rdfs:label "Oiliness" .
:Sensitivity rdf:type :SkinConcern ; rdfs:label "Sensitivity" .
:DarkSpots rdf:type :SkinConcern ; rdfs:label "Dark Spots" .

`;

    // Add REAL ingredient instances from database
    const ingredients = await Ingredient.findAll({ limit: 100 });
    
    ttl += `\n# ===== INGREDIENT INSTANCES =====\n`;
    for (const ingredient of ingredients) {
      const name = this.sanitize(ingredient.name);
      ttl += `
:${name} rdf:type :Ingredient ;
  rdfs:label "${ingredient.name}" ;
  :hasName "${ingredient.name}" .
`;

      // Add skin type suitability
      if (ingredient.suitableForSkinTypes) {
        for (const skinType of ingredient.suitableForSkinTypes) {
          ttl += `  :suitableFor :${this.sanitize(skinType)} ;\n`;
        }
      }

      // Add concern treatment
      if (ingredient.addressesConcerns) {
        for (const concern of ingredient.addressesConcerns) {
          ttl += `  :treatsConcern :${this.sanitize(concern)} ;\n`;
        }
      }

      ttl += '.\n';
    }

    // Add known ingredient interactions
    ttl += `\n# ===== INGREDIENT INTERACTIONS =====\n`;
    
    // Synergistic combinations (from research)
    const synergies = [
      ['Niacinamide', 'HyaluronicAcid'],
      ['Retinol', 'Peptides'], 
      ['VitaminC', 'VitaminE'],
      ['Ceramides', 'Cholesterol']
    ];

    for (const [ing1, ing2] of synergies) {
      ttl += `:${ing1} :synergisticWith :${ing2} .\n`;
      ttl += `:${ing2} :synergisticWith :${ing1} .\n`;
    }

    // Incompatible combinations
    const incompatibles = [
      ['Retinol', 'BenzoylPeroxide'],
      ['VitaminC', 'Retinol'],
      ['AHA', 'BHA']
    ];

    for (const [ing1, ing2] of incompatibles) {
      ttl += `:${ing1} :incompatibleWith :${ing2} .\n`;
      ttl += `:${ing2} :incompatibleWith :${ing1} .\n`;
    }

    // Save working ontology
    await fs.writeFile('backend/data/ontology/working_ontology.ttl', ttl);
    console.log('✅ Working ontology generated!');
  }

  sanitize(text) {
    return text.replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '');
  }
}

// RUN THIS IMMEDIATELY
new WorkingOntologyGenerator().generate();