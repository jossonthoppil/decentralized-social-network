const IPFS = require('ipfs')
const NodeRSA = require('node-rsa');
const _sodium = require('libsodium-wrappers');

async function setupfolders() {
    const node = await IPFS.create()
        //CREATING A ROOT FOLDER 
    await node.files.mkdir('/root_folder');
    //CREATING A PUBLIC PROFILE FOLDER
    await node.files.mkdir('/root_folder/public_profile');

    //CONTENTS IN PUBLIC PROFILE IS UNENCRYPTED 
    //TESTING BY ADDING SOME DATA TO PUBLIC PROFILE
    //***************************************//
    // const files_added = await node.add({path: '/root_folder/public_profile/about_me.txt', content: 'I AM MOHAN DAS, I LOVE SWIMMING!'});

    // console.log('Added file:', files_added[0].path, files_added[0].hash);
    // const fileBuffer = await node.cat(files_added[0].hash);
    // console.log('Added file contents:', fileBuffer.toString());
    //***************************************//

    // LOOK AT https://www.npmjs.com/package/node-rsa FOR IMPORT AND EXPORT FORMAT
    // CREATE 2048-BIT KEY FOR HOST

    const key = new NodeRSA({ b: 2048 });

    /*	KEY HAS THE FOLLOWING STRUCTURE

	NodeRSA {
	  keyPair: RSAKey {
	    n:
	    e:
	    d:
	    p:
	    q:
	    dmp1:
	    dmq1: 
	    coeff: 
	    cache: { keyBitLength: 2048, keyByteLength: 256 },
	    encryptionScheme: Scheme { key: [Circular], options: [Object] },
	    signingScheme: Scheme { key: [Circular], options: [Object] },
	    encryptEngine: { encrypt: [Function: encrypt], decrypt: [Function: decrypt] }
	  },
	  '$cache': {}
	}

    */

    files_added = await node.add({ path: '/root_folder/public_profile/about_me_encrypted.txt', content: key.encrypt(sodium.to_base64('Hello 123')) });

    // write code as above, to get contents of file buffer and print it back
    // documentation said it takes a buffer object, so before doing toString, can you try key.decrypt(fileBuffer); and see if 'I AM MOHAN DAS...' is printed?

    console.log('Decrypted text', key.decrypt(sodium.from_base64(node.cat(files_added[0].hash))));

    //HASH OF THE ROOT 
    const root = await node.files.stat('/root_folder');
    console.log("root_folder hash:");
    console.log(root.hash);

    // UPDATION OF ROOT HASH TO HAPPEN IN DATABSE HERE { FUNCTION NEEDED  }

    //HASH OF THE PUBLIC PROFILE
    const public_profile = await node.files.stat('/root_folder/public_profile');
    console.log("public_profile:");
    console.log(public_profile.hash);

}

// Creation of directory for the given friend and the Hello message.
async function create_friend_directory(friend_peerID) {

    const node = await IPFS.create();
    await _sodium.ready;
    const sodium = _sodium;
    
    //GENERATING SHARED SECRET KEY
    symmetric_key = sodium.crypto_secretbox_keygen();
    nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES); // new nonce for each encryption

    const directory = '/root_folder/' + friend_peerID;
    await node.files.mkdir(directory);

    /** TODO: create a shared-secret key, which is then encrypted with the friend's public key.
        Place this final output in the hello_message constant declared below. For now, it is 
        hardcoded to be the friend's peerID.
    */
  
    const hello_message = friend_peerID + ' ' + symmetric_key + ' and ' + nonce;
    const file_path = '/root_folder/' + friend_peerID + '/hello.txt';

    //GET KEY FROM DB
    const friend_public_key = {n:'something' , e:'something_else'}; 
    const pubkey = new NodeRSA();
    pubkey.importKey({
        n: Buffer.from(friend_public_key.n, 'base64'),
        e: Buffer.from(friend_public_key.e, 'base64'),
      }, 'components-public');
    
    const files_added = await node.add({ path: file_path, content: pubkey.encrypt(hello_message) });

    console.log('Created Hello message file: ', files_added[0].path, files_added[0].hash)
    const fileBuffer = await node.cat(files_added[0].hash)
    console.log('Contents of Hello message file:', fileBuffer.toString())
}


// Searching for for a Hello message created for us in given node's root folder, and getting the shared-secret.
async function search_peer_directory(friend_hash) {

    const node = await IPFS.create();
    await _sodium.ready;
    const sodium = _sodium;

    // Getting our peerID
    const nodeDetails = await Promise.resolve(node.id());
    const myPeerId = nodeDetails.id;

    // TODO: Query database for root_folder has for given friend_hash (received as function parameter)
    // and store it in rootHash. Hardcoded for now.
    const rootHash = 'QmYbR8Ery48YbJpJbU18rBRmdjZMmPih9YktKPhrwnRLa4';
    const helloMessagePath = '/ipfs/' + rootHash + '/' + myPeerId + '/hello.txt';

    // Read the contents of the Hello message, if it exists.
    const secretMessage = (await node.files.read(helloMessagePath)).toString('utf8');

    // Getting my private key object from the keystore
    const sk = get_private_key_object; // eslint-disable-line no-underscore-dangle
    const privkey = new NodeRSA();
    privkey.importKey({
      n: Buffer.from(sk.n, 'base64'),
      e: Buffer.from(sk.e, 'base64'),
      d: Buffer.from(sk.d, 'base64'),
      p: Buffer.from(sk.p, 'base64'),
      q: Buffer.from(sk.q, 'base64'),
      dmp1: Buffer.from(sk.dp, 'base64'),
      dmq1: Buffer.from(sk.dq, 'base64'),
      coeff: Buffer.from(sk.qi, 'base64'),
    }, 'components');

    /** At this point there are two possibilities:
        1. If the Hello message exists in their folder, the function continues execution.
        2. If the Hello message does not exist, and UnhandledPromiseRejectionWarning is raised.
           This is caught in the function call statement.
    */

    // The secretMessage should contain the shared-secret encrpyted with my public key.
    // TODO: decrypt this secret message using my private key.

    console.log(privkey.decrypt(secretMessage));
}


// Run this to setup folders.
// setupfolders();



/**  Run this to create the directory for the given friend and the Hello message.
     The function takes in the friend's peerID as parameter.
*/
// create_friend_directory("QmTNuULgQPpZceebSr15XYFXwRZK7JYF1jjqhHzkGs1nvp");



/** Run this to search for a Hello message created for you in a peer node's directory.
    Takes in the peer's peerID as parameter.
*/
/**
search_peer_directory('QmTNuULgQPpZceebSr15XYFXwRZK7JYF1jjqhHzkGs1nvp').catch(() => {
   console.log('File Not Found');
});
*/

// To write a personal post for someone
async function write_personal_post(friend_peerId, post, post_name) {
    await _sodium.ready;
    const sodium = _sodium;

    //Get the shared key from key store;
    symmetric_key = key_from_key_store;
    nonce = get_from_local_store;

    post_encoded = sodium.to_base64(post);
    const encrypted_post =  sodium.crypto_secretbox_easy(post_encoded, nonce, symmetric_key); //for now just directly assigning 

    //We are working with only text files for now! 
    file_path = '/root_folder/' + friend_peerId + '/personal_post/' + post_name + '.txt';

    const file_added = await node.add({ path: file_path, content: encrypted_post });

    //Hash of the file added
    console.log('Added file:', file_added[0].path, file_added[0].hash);

    //UPDATE THE root_folder HASH IN THE DATABASE NOW

}

/** To read all personal posts written for you, by a friend.
 *  These posts are present in a folder in the friend's node.
 */

async function read_personal_post(friend_hash) {
    await _sodium.ready;
    const sodium = _sodium;

    const node = await IPFS.create();

    // Getting our peerID
    const nodeDetails = await Promise.resolve(node.id());
    const myPeerId = nodeDetails.id;

    symmetric_key = key_from_key_store;
    nonce = get_from_local_store;

    // TODO: Query database for root_folder has for given friend_hash (received as function parameter)
    // and store it in rootHash. Hardcoded for now.
    const rootHash = 'QmR4WZmUYn3NtkCWUkwBEGJam8nBbeuEpeDfoU95UTzDtu';
    const file_path = 'ipfs/' + rootHash + '/' + myPeerId + '/personal_post/';

    const files = await node.files.ls('/root_folder/QmQqUVUHvMLEf532sX638Q2RGmqXVg7c34K4BCAxvPBRHx/personal_post');

    files.forEach(async(file) => {
        console.log(file);
        if (file.type == 0) {
            const buf = await node.files.read('/root_folder/QmQqUVUHvMLEf532sX638Q2RGmqXVg7c34K4BCAxvPBRHx/personal_post/' + file.name);
            const encrypted_post = buf.toString('utf8');
            post_buf = sodium.crypto_secretbox_open_easy(encrypted_post, nonce, sym_key);
            post = Buffer.from(sodium.from_base64(post_buf)).toString();
            console.log(post);
        }

    });

    /** At this point there are two possibilities:
        1. If the Hello message exists in their folder, the function continues execution.
        2. If the Hello message does not exist, and UnhandledPromiseRejectionWarning is raised.
            This is caught in the function call statement.
    */
}


// Function to create the Group Key, encrypt it using the Shared Secret, and store it in the friend peer ID folder
async function store_group_key(friend_peerID) {
    // Create the IPFS node
    const node = await IPFS.create();

    // File path to place the encrypted Group Key in
    const file_path = '/root_folder/' + friend_peerId + '/group_key.txt';

    // Place the encrypted Group Key in the file
    const group_key = "<Group Key's contents will be placed here>";
    const encrypted_group_key = group_key; // The Group Key will be encrypted here, for now it's used without encryption
    const file_added = await node.add({ path: file_path, content: encrypted_group_key }); // Place the encrypted Group Key in the required file 
}


// Function to read the posts within the Group file, by decrypting and using the Group Key
async function read_group_post(friend_peerID, shared_secret) {

    /* THE FOLDER CONTAINING GROUP POSTS IS CALLED 'group' */

    // Create the IPFS node
    const node = await IPFS.create();

    // Retrieve the Encrypted Group Key and Decrypt it
    const file_path = '/root_folder/' + friend_peerID + '/group_key.txt';
    const buffer = await ipfs.files.read(file_path) // Buffer of file contents
    const encrypted_group_key = buffer.toString('utf8') // Encrypted Group Key in string format
    const group_key = encrypted_group_key; // Decrypt the Encrypted Group Key using the shared secret. Hard-coded for now.

    // Use the Group Key to decrypt the contents of the Group Posts
    file_path = '/root_folder/group';
    const files = await node.files.ls(file_path);

    files.forEach(async(file) => {
        console.log(file);
        if (file.type == 0) {
            const buf = await node.files.read('/root_folder/group/' + file.name);
            console.log(buf.toString('utf8'));
        }

    });
}


// Function to write a post into the Group Posts
async function write_group_post(post, post_name) {
    // Encrypt the post using the Group Key
    const encrypted_post = post; //Hard-coded for now

    // Place the post in the Group 
    const file_path = '/root_folder/group/' + post_name;
    const file_added = await node.add({ path: file_path, content: encrypted_post });

    //Hash of the file added
    console.log('Added file:', file_added[0].path, file_added[0].hash);

    //UPDATE THE root_folder HASH IN THE DATABASE NOW

}

/** Run this to search for a Hello message created for you in a peer node's directory.
    Takes in the peer's peerID as parameter.
*/

// read_personal_post('QmQqUVUHvMLEf532sX638Q2RGmqXVg7c34K4BCAxvPBRHx').catch(() => {
//    console.log('File Not Found');
// });

// Run this code to set up the user's directory
// setupfolders();