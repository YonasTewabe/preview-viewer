// Utility functions for managing backend services data in JSON file

const API_BASE_URL = 'http://localhost:3001/api/backendnodes';

export const loadBackendServicesFromFile = async () => {
  try {
    const response = await fetch(API_BASE_URL);
    if (response.ok) {
      const data = await response.json();
      return data.backendServices || [];
    } else {
      console.warn('Could not load backend services from server, starting with empty array');
      return [];
    }
  } catch (error) {
    console.error('Error loading backend services from server:', error);
    // Fallback to localStorage if server is not available
    const savedData = localStorage.getItem('backendServices');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        return data.backendServices || [];
      } catch (e) {
        console.error('Error parsing localStorage data:', e);
      }
    }
    return [];
  }
};

export const saveBackendServicesToFile = async (backendServices) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ backendServices }),
    });

    if (response.ok) {
      // Also save to localStorage as backup
      const data = {
        backendServices: backendServices,
        lastUpdated: new Date().toISOString(),
        version: "1.0"
      };
      localStorage.setItem('backendServices', JSON.stringify(data));
      return true;
    } else {
      throw new Error('Failed to save to server');
    }
  } catch (error) {
    console.error('Error saving backend services to server:', error);
    // Fallback to localStorage only
    const data = {
      backendServices: backendServices,
      lastUpdated: new Date().toISOString(),
      version: "1.0"
    };
    localStorage.setItem('backendServices', JSON.stringify(data));
    return false;
  }
};

export const importBackendServicesFromFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.backendServices && Array.isArray(data.backendServices)) {
          resolve(data.backendServices);
        } else {
          reject(new Error('Invalid file format: backendServices array not found'));
        }
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};

export const updateBackendServicesInFile = async (backendServices) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ backendServices }),
    });

    if (response.ok) {
      // Also save to localStorage as backup
      const data = {
        backendServices: backendServices,
        lastUpdated: new Date().toISOString(),
        version: "1.0"
      };
      localStorage.setItem('backendServices', JSON.stringify(data));
      return true;
    } else {
      throw new Error('Failed to update on server');
    }
  } catch (error) {
    console.error('Error updating backend services on server:', error);
    // Fallback to localStorage only
    const data = {
      backendServices: backendServices,
      lastUpdated: new Date().toISOString(),
      version: "1.0"
    };
    localStorage.setItem('backendServices', JSON.stringify(data));
    return false;
  }
};

export const clearAllBackendServices = async () => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'DELETE',
    });

    if (response.ok) {
      localStorage.removeItem('backendServices');
      return true;
    } else {
      throw new Error('Failed to clear backend services on server');
    }
  } catch (error) {
    console.error('Error clearing backend services on server:', error);
    localStorage.removeItem('backendServices');
    return false;
  }
};

export const exportBackendServicesToFile = (backendServices) => {
  const data = {
    backendServices: backendServices,
    lastUpdated: new Date().toISOString(),
    version: "1.0"
  };
  
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'backend-services.json';
  link.click();
  URL.revokeObjectURL(url);
}; 