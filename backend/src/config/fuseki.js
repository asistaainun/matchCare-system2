const axios = require('axios');

class FusekiService {
  constructor() {
    this.baseURL = process.env.FUSEKI_URL || 'http://localhost:3030';
    this.dataset = process.env.FUSEKI_DATASET || 'matchcare';
    this.prefixes = {
      matchcare: 'http://www.semanticweb.org/msilaptop/ontologies/2025/4/skincareOntology/',
      owl: 'http://www.w3.org/2002/07/owl#',
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      xsd: 'http://www.w3.org/2001/XMLSchema#'
    };
  }

  async executeSPARQL(query) {
    try {
      // Add prefixes to query if not already present
      const prefixedQuery = this.addPrefixes(query);
      
      const response = await axios.post(
        `${this.baseURL}/${this.dataset}/sparql`,
        `query=${encodeURIComponent(prefixedQuery)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/sparql-results+json'
          },
          timeout: 10000
        }
      );
      return response.data;
    } catch (error) {
      console.error('SPARQL Query Error:', error.message);
      throw error;
    }
  }

  addPrefixes(query) {
    let prefixedQuery = '';
    
    // Add prefixes if not already in query
    for (const [prefix, uri] of Object.entries(this.prefixes)) {
      if (!query.includes(`PREFIX ${prefix}:`)) {
        prefixedQuery += `PREFIX ${prefix}: <${uri}>\n`;
      }
    }
    
    return prefixedQuery + query;
  }

  // Method untuk get products berdasarkan skin type menggunakan ontology
  async getProductsForSkinType(skinType) {
    const query = `
      SELECT ?product ?productName ?brand WHERE {
        ?product a :Product ;
                 :ProductName ?productName ;
                 :belongsToBrand ?brandNode .
        ?brandNode :BrandName ?brand .
        ?product :recommendedFor :${skinType} .
      }
      LIMIT 20
    `;
    
    return this.executeSPARQL(query);
  }

  // Method untuk get ingredient compatibility
  async getIngredientCompatibility(ingredients) {
    const ingredientList = ingredients.map(ing => `:${ing}`).join(', ');
    
    const query = `
      SELECT ?ingredient1 ?ingredient2 ?relationship WHERE {
        {
          ?ing1 :synergisticWith ?ing2 .
          ?ing1 :hasIngredientName ?ingredient1 .
          ?ing2 :hasIngredientName ?ingredient2 .
          BIND("synergistic" as ?relationship)
        } UNION {
          ?ing1 :incompatibleWith ?ing2 .
          ?ing1 :hasIngredientName ?ingredient1 .
          ?ing2 :hasIngredientName ?ingredient2 .
          BIND("incompatible" as ?relationship)
        }
        FILTER(?ing1 IN (${ingredientList}))
      }
    `;
    
    return this.executeSPARQL(query);
  }

  // Test connection ke Fuseki
  async testConnection() {
    try {
      const query = 'SELECT (COUNT(*) as ?count) WHERE { ?s ?p ?o }';
      const result = await this.executeSPARQL(query);
      return result.results.bindings.length > 0;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new FusekiService();