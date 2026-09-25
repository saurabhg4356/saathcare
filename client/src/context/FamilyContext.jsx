import React, { createContext, useState, useEffect, useContext } from 'react';
import { familyService } from '../services/familyService.js';
import { useAuth } from './AuthContext.jsx';

export const FamilyContext = createContext(null);

export function FamilyProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [familyGroups, setFamilyGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchGroups = async (preferredGroupId = null) => {
    if (!isAuthenticated) {
      setFamilyGroups([]);
      setActiveGroup(null);
      return;
    }

    setLoading(true);
    try {
      const groups = await familyService.getMyGroups();
      setFamilyGroups(groups);

      if (groups.length > 0) {
        const savedId = preferredGroupId || localStorage.getItem('saathcare_active_group_id');
        const found = groups.find(g => g._id === savedId);
        const selected = found || groups[0];
        setActiveGroup(selected);
        localStorage.setItem('saathcare_active_group_id', selected._id);
      } else {
        setActiveGroup(null);
        localStorage.removeItem('saathcare_active_group_id');
      }
    } catch (err) {
      console.error('Failed to load family groups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [isAuthenticated]);

  const selectGroup = (groupId) => {
    const selected = familyGroups.find(g => g._id === groupId);
    if (selected) {
      setActiveGroup(selected);
      localStorage.setItem('saathcare_active_group_id', selected._id);
    }
  };

  const createGroup = async (groupData) => {
    const newGroup = await familyService.createGroup(groupData);
    await fetchGroups(newGroup._id);
    return newGroup;
  };

  return (
    <FamilyContext.Provider
      value={{
        familyGroups,
        activeGroup,
        loading,
        selectGroup,
        refreshGroups: fetchGroups,
        createGroup
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
