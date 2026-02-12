import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  IconButton,
  Select,
  MenuItem,
  FormControlLabel, // <-- new import
  Checkbox,        // <-- new import
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getLocations } from '../structTransform'; // <-- unchanged
import { getAllProfiles, addProfile, deleteProfile, getProfile } from '../localStorage';
import type { Profile } from '../localStorage';


type SettingsPageProps = {
  selectedProfile: string;
  setSelectedProfile: React.Dispatch<React.SetStateAction<string>>;
};

export default function SettingsPage({
  selectedProfile,
  setSelectedProfile,
}: SettingsPageProps) {
  const [profiles, setProfiles] = useState<string[]>([]);
  const [newName, setNewName] = useState<string>('');
  const [profileCinemas, setProfileCinemas] = useState<Record<string, string[]>>({});

  // Load profiles on mount
  useEffect(() => {
    const all = getAllProfiles();
    setProfiles(all.map(p => p.name));
    // Initialize cinemas for the currently selected profile
    if (selectedProfile) {
      const prof = getProfile(selectedProfile);
      setProfileCinemas({ [selectedProfile]: prof?.cinemas ?? [] });
    }
  }, [selectedProfile]);

  // Update cinemas when selectedProfile changes
  useEffect(() => {
    if (!selectedProfile) {
      setProfileCinemas({});
      return;
    }
    const prof = getProfile(selectedProfile);
    setProfileCinemas({ [selectedProfile]: prof?.cinemas ?? [] });
  }, [selectedProfile]);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed || profiles.includes(trimmed)) return;
    const newProfile: Profile = { name: trimmed, cinemas: [] };
    addProfile(newProfile);
    setProfiles(prev => [...prev, trimmed]);
    setProfileCinemas(prev => ({ ...prev, [trimmed]: [] }));
    setNewName('');
  };

  // Remove a profile
  const handleDelete = (name: string) => {
    deleteProfile(name);
    setProfiles(prev => prev.filter(p => p !== name));
    setProfileCinemas(prev => {
      const newObj = { ...prev };
      delete newObj[name];
      return newObj;
    });
    if (selectedProfile === name) setSelectedProfile('');
  };

  // Cinema selector change
  const handleCinemaChange = (cinema: string) => {
    setProfileCinemas(prev => {
      const current = prev[selectedProfile] || [];
      const updated = current.includes(cinema)
        ? current.filter(c => c !== cinema)
        : [...current, cinema];
      // Persist updated cinemas
      addProfile({ name: selectedProfile, cinemas: updated });
      return { ...prev, [selectedProfile]: updated };
    });
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Profils
      </Typography>
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          label="Nouveau profil"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          size="small"
          sx={{ mr: 2 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAdd();
            }
          }}
        />
        <Button variant="contained" onClick={handleAdd}>
          Ajouter
        </Button>
      </Box>
      <Box display="flex" flexDirection="column">
      <FormControl component="fieldset" sx={{ mt: 2, minWidth: 200 }}>
        <FormLabel component="legend">Profil</FormLabel>
        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
          <Select
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value as string)}
            fullWidth
            size="small"
          >
            <MenuItem value="">
              <em>Pas de profil</em>
            </MenuItem>
            {profiles.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
          {selectedProfile && (
            <IconButton
              size="small"
              sx={{ ml: 1 }}
              onClick={() => handleDelete(selectedProfile)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </FormControl>

      {selectedProfile && (
        <FormControl sx={{ mt: 3, minWidth: 200 }}>
          <FormLabel component="legend">Cinémas</FormLabel>
          {getLocations().map((loc) => (
            <FormControlLabel
              key={loc}
              control={
                <Checkbox
                  checked={profileCinemas[selectedProfile]?.includes(loc) ?? false}
                  onChange={() => handleCinemaChange(loc)}
                />
              }
              label={loc}
            />
          ))}
        </FormControl>
      )}
      </Box>
    </Box>
  );
}
