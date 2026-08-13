import React, { createContext, useContext, useEffect, useState } from 'react';
import { Actor, Capacity, UserId, can, has } from '../../domain/actor';
import { ApiAuthGateway } from '../../infrastructure/api/ApiAuthGateway';
import { ExpoSecureStoreAdapter } from '../../infrastructure/storage/ExpoSecureStoreAdapter';
import { mockDb } from '../../infrastructure/mock/mockService';

interface AuthContextType {
  actor: Actor | null;
  isLoading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchActor: (userId: UserId) => void;
  toggleMyCapacity: (capacity: Capacity) => Promise<void>;
  updateUserCapacities: (userId: UserId, capacities: Capacity[]) => Promise<void>;
  allUsers: Actor[];
  canDo: (permission: Parameters<typeof can>[1]) => boolean;
  hasCapacity: (capacity: Capacity) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const authGateway = new ApiAuthGateway();
const secureStore = new ExpoSecureStoreAdapter();
const TOKEN_KEY = 'cerca_session_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [actor, setActor] = useState<Actor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<Actor[]>(mockDb.getUsers());

  useEffect(() => {
    async function initSession() {
      try {
        const savedToken = await secureStore.get(TOKEN_KEY);
        if (savedToken) {
          const current = await authGateway.getMe();
          setActor(current);
        } else {
          // Default to Admin Boss for demonstration
          const admin = mockDb.getUsers()[0];
          setActor(admin);
          await secureStore.set(TOKEN_KEY, `token-${admin.id}`);
        }
      } catch (err) {
        console.error('Failed to restore session', err);
      } finally {
        setIsLoading(false);
      }
    }
    initSession();
  }, []);

  const signIn = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await authGateway.signIn(email);
      await secureStore.set(TOKEN_KEY, res.accessToken);
      setActor(res.actor);
      setAllUsers(mockDb.getUsers());
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await secureStore.delete(TOKEN_KEY);
    await authGateway.signOut();
    setActor(null);
  };

  const switchActor = (userId: UserId) => {
    const switched = mockDb.setCurrentActor(userId);
    setActor({ ...switched });
    setAllUsers(mockDb.getUsers());
  };

  const toggleMyCapacity = async (capacity: Capacity) => {
    if (!actor) return;
    const updated = await authGateway.toggleCapacity(capacity);
    setActor({ ...updated });
    setAllUsers(mockDb.getUsers());
  };

  const updateUserCapacities = async (userId: UserId, capacities: Capacity[]) => {
    const updated = mockDb.updateUserCapacities(userId, capacities);
    setAllUsers(mockDb.getUsers());
    if (actor && actor.id === userId) {
      setActor({ ...updated });
    }
  };

  const canDo = (permission: Parameters<typeof can>[1]): boolean => {
    if (!actor) return false;
    return can(actor, permission);
  };

  const hasCapacity = (capacity: Capacity): boolean => {
    if (!actor) return false;
    return has(actor, capacity);
  };

  return (
    <AuthContext.Provider
      value={{
        actor,
        isLoading,
        signIn,
        signOut,
        switchActor,
        toggleMyCapacity,
        updateUserCapacities,
        allUsers,
        canDo,
        hasCapacity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
