// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const postContent = document.getElementById('post-content');
const postImage = document.getElementById('post-image');
const postBtn = document.getElementById('post-btn');
const postsContainer = document.getElementById('posts');

// Authentication
auth.onAuthStateChanged(user => {
    if (user) {
        userInfo.innerText = `Hola, ${user.displayName}`;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        loadPosts();
    } else {
        userInfo.innerText = '';
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
    }
});

loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Post a new message
postBtn.addEventListener('click', async () => {
    const content = postContent.value;
    const file = postImage.files[0];
    const user = auth.currentUser;

    if (!user) {
        alert('Inicia sesión para publicar.');
        return;
    }

    let imageUrl = '';

    if (file) {
        const storageRef = storage.ref(`images/${file.name}`);
        await storageRef.put(file);
        imageUrl = await storageRef.getDownloadURL();
    }

    await db.collection('posts').add({
        content,
        imageUrl,
        uid: user.uid,
        author: user.displayName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        expireAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
    });

    postContent.value = '';
    postImage.value = '';
    loadPosts();
});

// Load posts
const loadPosts = () => {
    db.collection('posts').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        postsContainer.innerHTML = '';
        snapshot.forEach(doc => {
            const post = doc.data();
            if (post.expireAt.toDate() > new Date()) {
                const postElement = document.createElement('div');
                postElement.className = 'post';
                postElement.innerHTML = `
                    <p><strong>${post.author}</strong></p>
                    <p>${post.content}</p>
                    ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post Image">` : ''}
                    <button onclick="deletePost('${doc.id}')">Eliminar</button>
                `;
                postsContainer.appendChild(postElement);
            } else {
                db.collection('posts').doc(doc.id).delete();
            }
        });
    });
};

// Delete post
window.deletePost = async (id) => {
    await db.collection('posts').doc(id).delete();
    loadPosts();
};

