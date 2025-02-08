import { getUserPreferences, updateUserPreferences } from '../../lib/api';

export default function PreferredAccessories({ userId }) {
  const [preferences, setPreferences] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchPreferences() {
      try {
        const data = await getUserPreferences(userId);
        setPreferences(data.preferred_accessories || []);
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPreferences();
  }, [userId]);

  async function handleSave(newPreferences) {
    try {
      await updateUserPreferences(userId, { preferred_accessories: newPreferences });
      setPreferences(newPreferences);
      alert('Preferences updated!');
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Your Preferred Accessories</h2>
      <input
        type="text"
        value={preferences.join(', ')}
        onChange={(e) => setPreferences(e.target.value.split(', '))}
      />
      <button onClick={() => handleSave(preferences)}>Save</button>
    </div>
  );
}

export { PreferredAccessories }
