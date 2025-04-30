---
layout: default
title: Research Portfolio
---

<div id="div1">
  {% for goal in site.data.research_questions %}
  <div class="goal">
    <h2>
      {{ goal.title }}
      <span class="toggle-detail">Detail</span>
    </h2>
    <ul class="details-list">
      {% for item in goal.details %}
      <li>
        {{ item.question }}
        <span class="toggle-more">More Detail</span>
        <p class="explanation">{{ item.explanation }}</p>
      </li>
      {% endfor %}
    </ul>
  </div>
  {% endfor %}
</div>

<div id="div2">
  <h2>John Doe</h2>
  <img src="/assets/avatar.png" alt="photo of John Doe" class="avatar">
  <p>Your personal bio…</p>
</div>
