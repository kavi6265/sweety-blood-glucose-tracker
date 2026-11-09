
import { useEffect, useState } from "react";
import api from "../services/api";
import "./Profile.css";

const emptyForm = {
  name: "",
  email: "",
  currentPassword: "",
  newPassword: "",
};

export default function Profile() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  async function loadProfile() {
    setLoading(true);

    try {
      const response = await api.get("/auth/profile");
      const user = response.data.user;

      setForm({
        name: user.name || "",
        email: user.email || "",
        currentPassword: "",
        newPassword: "",
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to load your profile. Please log in again if needed."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setMessageType("");
  }

  async function handleSave(event) {
    event.preventDefault();

    if (saving) return;

    if (!form.name.trim() || !form.email.trim()) {
      setMessage("Name and email are required.");
      setMessageType("error");
      return;
    }

    const changingPassword =
      form.currentPassword.length > 0 ||
      form.newPassword.length > 0;

    if (changingPassword) {
      if (!form.currentPassword || !form.newPassword) {
        setMessage("Enter both current and new passwords.");
        setMessageType("error");
        return;
      }

      if (form.newPassword.length < 8) {
        setMessage("New password must contain at least 8 characters.");
        setMessageType("error");
        return;
      }

      if (new TextEncoder().encode(form.newPassword).length > 72) {
        setMessage("New password must not exceed 72 bytes.");
        setMessageType("error");
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
    };

    if (changingPassword) {
      payload.currentPassword = form.currentPassword;
      payload.newPassword = form.newPassword;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await api.patch("/auth/profile", payload);
      const savedUser = response.data.user;

      // Display the data returned by PostgreSQL.
      // Do not save profile fields or passwords in localStorage.
      setForm({
        name: savedUser.name,
        email: savedUser.email,
        currentPassword: "",
        newPassword: "",
      });

      setEditing(false);
      setMessage(
        changingPassword
          ? "Profile and password updated successfully in the database."
          : "Name and email updated successfully in the database."
      );
      setMessageType("success");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to save your changes. Please try again."
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditing(false);
    setMessage("");
    setMessageType("");
    loadProfile();
  }

  const initials = form.name
    ? form.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "U";

  if (loading) {
    return <div className="profile-page">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-heading">
        <div>
          <h2>My Profile</h2>
          <p>Manage your personal information and password.</p>
        </div>

        {!editing && (
          <button
            className="profile-edit-btn"
            type="button"
            onClick={() => {
              setEditing(true);
              setMessage("");
              setMessageType("");
            }}
          >
            Edit Profile
          </button>
        )}
      </div>

      <section className="profile-card">
        <div className="profile-banner" />

        <div className="profile-avatar">{initials}</div>

        <div className="profile-user-heading">
          <h3>{form.name || "Your Name"}</h3>
          <p>{form.email || "Your email address"}</p>
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          <div className="profile-form-grid">
            <div className="profile-field">
              <label htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={!editing || saving}
                required
                maxLength={100}
                placeholder="Enter your full name"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-email">Email Address</label>
              <input
                id="profile-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                disabled={!editing || saving}
                required
                maxLength={255}
                placeholder="Enter your email"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-current-password">
                Current Password
              </label>
              <input
                id="profile-current-password"
                name="currentPassword"
                type="password"
                value={form.currentPassword}
                onChange={handleChange}
                disabled={!editing || saving}
                autoComplete="current-password"
                placeholder="Required to change password"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-new-password">New Password</label>
              <input
                id="profile-new-password"
                name="newPassword"
                type="password"
                value={form.newPassword}
                onChange={handleChange}
                disabled={!editing || saving}
                autoComplete="new-password"
                minLength={8}
                placeholder="Enter a new password"
              />
              <small>
                Leave both password fields blank to keep your current
                password.
              </small>
            </div>
          </div>

          {message && (
            <p
              className={`profile-message ${messageType}`}
              role="status"
            >
              {message}
            </p>
          )}

          {editing && (
            <div className="profile-actions">
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="profile-save-btn"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </section>

      <p className="profile-note">
        Profile information is loaded from and saved to the database.
        Passwords are stored as secure hashes.
      </p>
    </div>
  );
}
