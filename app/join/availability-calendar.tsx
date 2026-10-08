"use client";

import { useState } from "react";
import { availabilityDays, mealWindows } from "../../lib/availability";

export default function AvailabilityCalendar({ value, onToggle }: { value: string[]; onToggle: (slot: string) => void }) {
  const [showFutureMeals, setShowFutureMeals] = useState(false);
  const visibleMeals = mealWindows.filter(meal => showFutureMeals || meal.id === "dinner");
  const hasDinner = value.some(slot => slot.endsWith(" dinner"));
  return <fieldset className="availability-field">
    <legend>When can you pull up?<span className="selection-hint">please select all that usually work for you</span></legend>
    <p className="helper" id="availability-help">Pick dinner days for next week and later. 6–8 PM Pacific.</p>
    <div className="availability-calendar" role="region" aria-label="Weekly availability calendar" tabIndex={0}>
      <table aria-describedby="availability-help availability-pilot">
        <caption className="sr-only">Choose any breakfast, lunch, or dinner times that usually work for you.</caption>
        <thead><tr><th scope="col"><span className="sr-only">Meal</span></th>{availabilityDays.map(day => <th scope="col" key={day.short}><abbr title={day.name}>{day.short}</abbr></th>)}</tr></thead>
        <tbody>{visibleMeals.map(meal => <tr key={meal.id}>
          <th scope="row"><span>{meal.name}</span><small>{meal.hours}</small></th>
          {availabilityDays.map(day => {
            const slot = `${day.short} ${meal.id}`;
            const selected = value.includes(slot);
            return <td key={slot}><button type="button" aria-label={`${day.name} ${meal.id}, ${meal.hours}`} aria-pressed={selected} className={selected ? "availability-cell selected" : "availability-cell"} onClick={() => onToggle(slot)}><span aria-hidden="true">{selected ? "✓" : "+"}</span></button></td>;
          })}
        </tr>)}</tbody>
      </table>
    </div>
    <p className="availability-swipe">Swipe across to see the whole week.</p>
    <button type="button" className="ic-partner-link availability-more" aria-expanded={showFutureMeals} onClick={() => setShowFutureMeals(current => !current)}>{showFutureMeals ? "Hide breakfast and lunch" : "Add breakfast / lunch for future plans (optional)"}</button>
    <p className="availability-pilot" id="availability-pilot">You’ll confirm the exact date and time with each invitation.{showFutureMeals && " Breakfast and lunch are for future plans. Lunch means 12–3 PM."}</p>
    <p className="helper" aria-live="polite">{value.length ? `${value.length} ${value.length === 1 ? "time" : "times"} selected.${!hasDinner ? " Saved for later plans. Add a dinner time to be considered for the first dinners." : ""}` : "Pick the times that work for you. Nothing is booked yet."}</p>
  </fieldset>;
}
