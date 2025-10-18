/**
 * Clients Service
 *
 * Handles all Firestore operations for the Clients collection.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/client';
import { Client } from '@/types';

const CLIENTS_COLLECTION = 'clients';

/**
 * Create a new client
 */
export async function createClient(
  clientData: Omit<Client, 'clientId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = getFirebaseFirestore();

  const newClient: Omit<Client, 'clientId'> = {
    ...clientData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), newClient);

  // Update the document with its own ID
  await updateDoc(docRef, { clientId: docRef.id });

  return docRef.id;
}

/**
 * Get a single client by ID
 */
export async function getClient(clientId: string): Promise<Client | null> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, CLIENTS_COLLECTION, clientId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { ...docSnap.data(), clientId: docSnap.id } as Client;
  }

  return null;
}

/**
 * Update a client
 */
export async function updateClient(
  clientId: string,
  updates: Partial<Client>
): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, CLIENTS_COLLECTION, clientId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a client
 */
export async function deleteClient(clientId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, CLIENTS_COLLECTION, clientId);
  await deleteDoc(docRef);
}

/**
 * Get all clients
 */
export async function getClients(searchTerm?: string): Promise<Client[]> {
  const db = getFirebaseFirestore();

  const q = query(
    collection(db, CLIENTS_COLLECTION),
    orderBy('name', 'asc')
  );

  const snapshot = await getDocs(q);

  let clients = snapshot.docs.map(doc => ({
    ...doc.data(),
    clientId: doc.id,
  })) as Client[];

  // Client-side search filtering
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    clients = clients.filter(client =>
      client.name.toLowerCase().includes(searchLower) ||
      client.invoicingContact.name?.toLowerCase().includes(searchLower) ||
      client.invoicingContact.email?.toLowerCase().includes(searchLower)
    );
  }

  return clients;
}

/**
 * Get clients for dropdown/select
 */
export async function getClientsForSelect(): Promise<Array<{ value: string; label: string }>> {
  const clients = await getClients();
  return clients.map(client => ({
    value: client.clientId,
    label: client.name,
  }));
}
