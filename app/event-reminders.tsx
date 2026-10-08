import { ALLERGY_REMINDER, PHOTO_REMINDER } from "../lib/event-reminders";

export default function EventReminders() {
  return <aside aria-label="Photo preferences and food allergies">
    <p><strong>Photos 📸</strong><br/>{PHOTO_REMINDER}</p>
    <p><strong>Food allergies</strong><br/>{ALLERGY_REMINDER}</p>
  </aside>;
}
