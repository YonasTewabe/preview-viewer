// Utility functions for managing node data in JSON file

const API_BASE_URL = 'http://localhost:3001/api/nodes';

export const loadNodesFromFile = async () => {
  try {
    const response = await fetch(API_BASE_URL);
    if (response.ok) {
      const data = await response.json();
      return data.nodes || [];
    } else {
      console.warn('Could not load nodes from server, starting with empty array');
      return [];
    }
  } catch (error) {
    console.error('Error loading nodes from server:', error);
    // Fallback to localStorage if server is not available
    const savedData = localStorage.getItem('frontendNodes');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        return data.nodes || [];
      } catch (e) {
        console.error('Error parsing localStorage data:', e);
      }
    }
    return [];
  }
};

export const saveNodesToFile = async (nodes) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nodes }),
    });

    if (response.ok) {
      // Also save to localStorage as backup
      const data = {
        nodes: nodes,
        lastUpdated: new Date().toISOString(),
        version: "1.0"
      };
      localStorage.setItem('frontendNodes', JSON.stringify(data));
      return true;
    } else {
      throw new Error('Failed to save to server');
    }
  } catch (error) {
    console.error('Error saving nodes to server:', error);
    // Fallback to localStorage only
    const data = {
      nodes: nodes,
      lastUpdated: new Date().toISOString(),
      version: "1.0"
    };
    localStorage.setItem('frontendNodes', JSON.stringify(data));
    return false;
  }
};

export const importNodesFromFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.nodes && Array.isArray(data.nodes)) {
          resolve(data.nodes);
        } else {
          reject(new Error('Invalid file format: nodes array not found'));
        }
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};

export const updateNodesInFile = async (nodes) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nodes }),
    });

    if (response.ok) {
      // Also save to localStorage as backup
      const data = {
        nodes: nodes,
        lastUpdated: new Date().toISOString(),
        version: "1.0"
      };
      localStorage.setItem('frontendNodes', JSON.stringify(data));
      return true;
    } else {
      throw new Error('Failed to update on server');
    }
  } catch (error) {
    console.error('Error updating nodes on server:', error);
    // Fallback to localStorage only
    const data = {
      nodes: nodes,
      lastUpdated: new Date().toISOString(),
      version: "1.0"
    };
    localStorage.setItem('frontendNodes', JSON.stringify(data));
    return false;
  }
};

export const clearAllNodes = async () => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'DELETE',
    });

    if (response.ok) {
      localStorage.removeItem('frontendNodes');
      return true;
    } else {
      throw new Error('Failed to clear nodes on server');
    }
  } catch (error) {
    console.error('Error clearing nodes on server:', error);
    localStorage.removeItem('frontendNodes');
    return false;
  }
};

export const exportNodesToFile = (nodes) => {
  const data = {
    nodes: nodes,
    lastUpdated: new Date().toISOString(),
    version: "1.0"
  };
  
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'nodes.json';
  link.click();
  URL.revokeObjectURL(url);
}; 