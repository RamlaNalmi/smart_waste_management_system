// Hierarchical location mapping for Colombo bins
// Structure: District -> Area -> Specific Location

const colomboHierarchicalLocations = {
  // Colombo Central District
  'colombo_central': {
    name: 'Colombo Central',
    areas: {
      'fort_area': {
        name: 'Fort Area',
        locations: {
          'esp32_01': {
            device_id: 'esp32_01',
            name: 'Colombo Fort Railway Station',
            address: 'Colombo Fort Railway Station, Colombo 01',
            coordinates: [6.9339, 79.8498],
            description: 'Main transportation hub',
            waste_type: 'Organic (Bio-Degradable) Waste',
            max_weight: 500, // kg
            current_weight: 0 // kg
          },
          'esp32_02': {
            device_id: 'esp32_02',
            name: 'World Trade Center',
            address: 'World Trade Center, Colombo 01',
            coordinates: [6.9315, 79.8467],
            description: 'Business district center',
            waste_type: 'Recyclable Waste',
            max_weight: 750, // kg
            current_weight: 0 // kg
          }
        }
      },
      'pettah_area': {
        name: 'Pettah Area',
        locations: {
          'esp32_03': {
            device_id: 'esp32_03',
            name: 'Khan Clock Tower',
            address: 'Khan Clock Tower, Main Street, Pettah, Colombo 11',
            coordinates: [6.9381, 79.8456],
            description: 'Historic market area',
            waste_type: 'Organic (Bio-Degradable) Waste',
            max_weight: 600, // kg
            current_weight: 0 // kg
          },
          'esp32_04': {
            device_id: 'esp32_04',
            name: 'Pettah Market',
            address: 'Pettah Market, Colombo 11',
            coordinates: [6.9369, 79.8478],
            description: 'Busy commercial market',
            waste_type: 'Non-recyclable Waste',
            max_weight: 800, // kg
            current_weight: 0 // kg
          }
        }
      }
    }
  },

  // Colombo North District
  'colombo_north': {
    name: 'Colombo North',
    areas: {
      'marine_drive': {
        name: 'Marine Drive',
        locations: {
          'esp32_05': {
            device_id: 'esp32_05',
            name: 'Galle Face Green',
            address: 'Galle Face Green, Colombo 02',
            coordinates: [6.9219, 79.8456],
            description: 'Coastal recreational area',
            waste_type: 'Recyclable Waste',
            max_weight: 650, // kg
            current_weight: 0 // kg
          },
          'esp32_06': {
            device_id: 'esp32_06',
            name: 'Galle Face Hotel',
            address: 'Galle Face Hotel, Colombo 02',
            coordinates: [6.9189, 79.8489],
            description: 'Historic hotel area',
            waste_type: 'Organic (Bio-Degradable) Waste',
            max_weight: 550, // kg
            current_weight: 0 // kg
          }
        }
      },
      'kollupitiya': {
        name: 'Kollupitiya',
        locations: {
          'esp32_07': {
            device_id: 'esp32_07',
            name: 'Kollupitiya Junction',
            address: 'Kollupitiya Junction, Colombo 03',
            coordinates: [6.9167, 79.8467],
            description: 'Major traffic junction',
            waste_type: 'Organic (Bio-Degradable) Waste',
            max_weight: 700, // kg
            current_weight: 0 // kg
          }
        }
      }
    }
  },

  // Colombo South District
  'colombo_south': {
    name: 'Colombo South',
    areas: {
      'cinnamon_gardens': {
        name: 'Cinnamon Gardens',
        locations: {
          'esp32_08': {
            device_id: 'esp32_08',
            name: 'Independence Square',
            address: 'Independence Square, Colombo 07',
            coordinates: [6.9144, 79.8489],
            description: 'National heritage site',
            waste_type: 'Recyclable Waste',
            max_weight: 450, // kg
            current_weight: 0 // kg
          },
          'esp32_09': {
            device_id: 'esp32_09',
            name: 'Viharamahadevi Park',
            address: 'Viharamahadevi Park, Colombo 07',
            coordinates: [6.9111, 79.8511],
            description: 'Public recreational park',
            waste_type: 'Organic (Bio-Degradable) Waste',
            max_weight: 600, // kg
            current_weight: 0 // kg
          }
        }
      },
      'bambalapitiya': {
        name: 'Bambalapitiya',
        locations: {
          'esp32_10': {
            device_id: 'esp32_10',
            name: 'Bambalapitiya Market',
            address: 'Bambalapitiya Market, Colombo 04',
            coordinates: [6.8789, 79.8611],
            description: 'Local market area',
            waste_type: 'Non-recyclable Waste',
            max_weight: 750, // kg
            current_weight: 0 // kg
          }
        }
      }
    }
  }
};

// Helper function to get location data for a device
export const getBinLocation = (deviceId) => {
  for (const district of Object.values(colomboHierarchicalLocations)) {
    for (const area of Object.values(district.areas)) {
      const location = area.locations[deviceId];
      if (location) {
        return {
          ...location,
          district: district.name,
          area: area.name,
          hierarchy: {
            district: district.name,
            area: area.name,
            specific: location.name
          }
        };
      }
    }
  }
  return null;
};

// Helper function to get all bins by district
export const getBinsByDistrict = () => {
  const result = {};
  
  for (const [districtKey, district] of Object.entries(colomboHierarchicalLocations)) {
    result[districtKey] = {
      name: district.name,
      bins: []
    };
    
    for (const area of Object.values(district.areas)) {
      for (const location of Object.values(area.locations)) {
        result[districtKey].bins.push({
          ...location,
          district: district.name,
          area: area.name
        });
      }
    }
  }
  
  return result;
};

// Helper function to get all bins by area
export const getBinsByArea = () => {
  const result = {};
  
  for (const district of Object.values(colomboHierarchicalLocations)) {
    for (const [areaKey, area] of Object.entries(district.areas)) {
      result[areaKey] = {
        name: area.name,
        district: district.name,
        bins: Object.values(area.locations).map(location => ({
          ...location,
          district: district.name,
          area: area.name
        }))
      };
    }
  }
  
  return result;
};

// Get all locations for mapping
export const getAllBinLocations = () => {
  const locations = [];
  
  for (const district of Object.values(colomboHierarchicalLocations)) {
    for (const area of Object.values(district.areas)) {
      for (const location of Object.values(area.locations)) {
        locations.push({
          ...location,
          district: district.name,
          area: area.name
        });
      }
    }
  }
  
  return locations;
};

export default colomboHierarchicalLocations;
