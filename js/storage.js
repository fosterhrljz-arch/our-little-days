(function () {
  'use strict';
  let database;
  function open() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('This browser does not support local storage. Please use Chrome, Edge, Firefox, or Safari in a normal window.'));
      const request = indexedDB.open('our-little-days', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('book');
      request.onerror = () => reject(new Error('Local storage could not be opened. Check browser privacy settings and try a normal window.'));
      request.onblocked = () => reject(new Error('Another window is blocking storage. Close other Our Little Days windows and reload.'));
      request.onsuccess = () => { database = request.result; database.onversionchange = () => database.close(); resolve(); };
    });
  }
  function load() {
    return new Promise((resolve, reject) => {
      const tx = database.transaction('book', 'readonly');
      const request = tx.objectStore('book').get('current');
      tx.oncomplete = () => resolve(request.result || null);
      tx.onerror = () => reject(tx.error);
    });
  }
  function save(data, expectedRevision) {
    return new Promise((resolve, reject) => {
      let result, conflict = false;
      const tx = database.transaction('book', 'readwrite');
      const store = tx.objectStore('book');
      const request = store.get('current');
      request.onsuccess = () => {
        if ((request.result?.revision || 0) !== expectedRevision) { conflict = true; tx.abort(); return; }
        result = { revision: expectedRevision + 1, data };
        store.put(result, 'current');
      };
      tx.oncomplete = () => resolve(result.revision);
      tx.onabort = () => reject(new Error(conflict ? 'This book changed in another window. Close this dialog and reload before editing again. Your changes were not saved.' : 'Your changes could not be saved. Device storage may be full. Download a backup and free some space before trying again.'));
      tx.onerror = () => {};
    });
  }
  window.OLDStore = { open, load, save };
})();
