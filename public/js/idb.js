let db;
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('pending_entry', { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;

    if (navigator.onLine) {
        checkDb();
    }
};

request.onerror = function(event) {
    console.log('Error' + event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['pending_entry'], 'readwrite');

    const entryObjectStore = transaction.objectStore('pending_entry');

    entryObjectStore.add(record);
}

function checkDb() {
    const transaction = db.transaction(['pending_entry'], 'readwrite');

    const entryObjectStore = transaction.objectStore('pending_entry');

    const getAll = entryObjectStore.getAll();

    getAll.onsuccess = function() {
        fetch('api/transaction/bulk', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(serverResponse => {
            if (serverResponse.message) {
                throw new Error(serverResponse);
            }

            const transaction = db.transaction(['pending_entry'], 'readwrite');

            const entryObjectStore = transaction.objectStore('pending_entry');

            entryObjectStore.clear();
        })
        .catch(err => {
            console.log(err);
        });
    }
} 


window.addEventListener('online', checkDb);