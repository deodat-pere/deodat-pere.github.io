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
  FormControlLabel,
  Checkbox,
  Switch,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getLocations } from '../structTransform';
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
  const [profileCinemas, setProfileCinemas] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [onlySelected, setOnlySelected] = useState<boolean>(false);

  // Load profiles on mount
  useEffect(() => {
    const all = getAllProfiles();
    setProfiles(all.map(p => p.name));
    // Initialize cinemas for the currently selected profile
    if (selectedProfile) {
      const prof = getProfile(selectedProfile);
      setProfileCinemas(prof?.cinemas ?? [] );
    }
  }, [selectedProfile]);

  // Update cinemas when selectedProfile changes
  useEffect(() => {
    if (!selectedProfile) {
      setProfileCinemas([]);
      return;
    }
    const prof = getProfile(selectedProfile);
    setProfileCinemas( prof?.cinemas ?? [] );
  }, [selectedProfile]);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed || profiles.includes(trimmed)) return;
    const newProfile: Profile = { name: trimmed, cinemas: [], favorites:[], bookmarks: [] };
    addProfile(newProfile);
    setProfiles(prev => [...prev, trimmed]);
    setProfileCinemas(prev => ({ ...prev, [trimmed]: [] }));
    setNewName('');
    setSelectedProfile(trimmed);
  };

  // Remove a profile
  const handleDelete = (name: string) => {
    deleteProfile(name);
    setProfiles(prev => prev.filter(p => p !== name));
    if (selectedProfile === name) setSelectedProfile('');
  };

  // Cinema selector change
  const handleCinemaChange = (cinema: string) => {
    setProfileCinemas(prev => {
      const current = prev || [];
      const updated = current.includes(cinema)
        ? current.filter(c => c !== cinema)
        : [...current, cinema];
      // Persist updated cinemas
      const prof = getProfile(selectedProfile)
      if (prof) {
        addProfile({ ...prof, cinemas: updated });
      }
      return updated;
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
      <FormControl component="fieldset" sx={{ mt: 3, minWidth: 200 }}>
        <FormLabel component="legend">Cinémas</FormLabel>
        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Rechercher un cinéma"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ mr: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={onlySelected}
                onChange={(e) => setOnlySelected(e.target.checked)}
                color="primary"
              />
            }
            label="Mes cinémas"
            sx={{ whiteSpace: 'nowrap' }}
          />
          </Box>
        <Box sx={{ maxHeight: 200, overflowY: 'auto', display: "flex", flexDirection: "column" }}>
          {getLocations()
            .filter((loc) =>
              loc.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .filter((loc) => !onlySelected || profileCinemas.includes(loc))
            .sort((a, b) => a.localeCompare(b))
            .map((loc) => (
              <FormControlLabel
                key={loc}
                control={
                  <Checkbox
                    checked={profileCinemas.includes(loc)}
                    onChange={() => handleCinemaChange(loc)}
                  />
                }
                label={loc}
              />
            ))}
        </Box>
      </FormControl>
      )}
      </Box>
    </Box>
  );
}
