const SELECTED_KEY = 'selectedProfile';
const PROFILES_KEY = 'userProfiles';

export type Profile = {
    name: string,
    cinemas: string[]
}

export function getSelectedProfile(): string | null {
    return localStorage.getItem(SELECTED_KEY);
}

export function setSelectedProfile(profileName: string): void {
    localStorage.setItem(SELECTED_KEY, profileName);
}

/**
 * Retrieves all profiles from localStorage.
 * @returns {Profile[]} An array of profiles, or an empty array if none exist.
 */
export function getAllProfiles(): Profile[] {
    const data = localStorage.getItem(PROFILES_KEY);
    return data ? JSON.parse(data) as Profile[] : [];
}

export function addProfile(profile: Profile): void {
    const profiles = getAllProfiles();
    const index = profiles.findIndex(p => p.name === profile.name);
    if (index >= 0) {
        profiles[index] = profile;
    } else {
        profiles.push(profile);
    }
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function deleteProfile(profileName: string): void {
    const profiles = getAllProfiles();
    const filtered = profiles.filter(p => p.name !== profileName);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(filtered));
}

export function getProfile(profileName: string): Profile | null {
    const profiles = getAllProfiles();
    const profile = profiles.find(p => p.name === profileName);
    return profile ?? null;
}

