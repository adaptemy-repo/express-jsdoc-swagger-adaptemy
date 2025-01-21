const addClientValues = (values = []) => {
  if (values.length === 0) return {};
  return { clients: values };
};

function hasClientProperty(clientObj) {
  function search(obj) {
    if (obj && typeof obj === 'object') {
      if ('clients' in obj) {
        return true;
      }
      return Object.values(obj).some(value => search(value));
    }
    return false;
  }
  return search(clientObj);
}

function removePropertyByClient(clientObj, clientName) {
  function process(obj) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      // Go through every key in the object
      return Object.entries(obj).reduce((result, [key, value]) => {
        const response = { ...result };
        // Check if the current value is an object with a 'clients' key
        if (value && typeof value === 'object' && 'clients' in value) {
          // Keep the entry only if the clientName is in the 'clients' array
          if (value.clients.includes(clientName)) {
            // Delete the clients parameter after use so it doesn't show up in the schema
            const valueWithoutClients = { ...value };
            delete valueWithoutClients.clients;
            response[key] = process(valueWithoutClients); // Recursively process nested objects
          }
        } else {
          // Recursively process nested objects and keep non-clients entries
          response[key] = process(value);
        }
        return response;
      }, {});
    }
    // Return non-object values as-is
    return obj;
  }

  return process(clientObj);
}

module.exports = {
  addClientValues,
  removePropertyByClient,
  hasClientProperty,
};
