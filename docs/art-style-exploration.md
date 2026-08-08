# אמנדה — סבב בקרה #1: בחירת כיוון סגנון

**מטרה:** לבחור כיוון ויזואלי אחד למשחק כולו. אחרי הבחירה נכתוב "תנ״ך סגנון" (`art-bible.md`) וכל 60–80 המפלצות ייוצרו לפיו — עקביות היא הדבר הכי חשוב.

## איך עובדים (15–30 דקות)

1. פותחים כלי AI לתמונות (המלצה: **Midjourney v7**, **GPT-Image / ChatGPT**, או **Recraft** — כולם מצוינים; Recraft הכי חזק בעקביות סגנון)
2. מריצים **את אותן 3 מפלצות-בוחן בכל אחד מ-4 הכיוונים** = 12 תמונות
3. שמים את התוצאות זו לצד זו ובוחרים כיוון אחד
4. שומרים את התמונות ב-`assets/style-tests/<כיוון>/<מפלצת>.png` ומספרים לי מה בחרתם

> 💡 **למה 3 מפלצות-בוחן?** הן מייצגות את הקצוות: דרקון אש עוצמתי, סליים רך וחמוד, וענק-מלך ענקי. אם סגנון עובד על שלושתן — הוא יעבוד על הכול.

---

## 3 מפלצות-הבוחן

| # | מפלצת | תיאור מה-GDD |
|---|--------|---------------|
| A | **פליים דראגון** (Flame Dragon) | דרקון אש, 433 חיים / 1300 עוצמה. מסתער קדימה, מכה הודפת. אגרסיבי ומהיר |
| B | **סליים בסיסי** (Basic Slime) | סליים בוץ ג'לטיני, 600/300. זוחל לאט, סופג הדף. רך וחמוד |
| C | **זליג הענק** (Zelig the Giant Ooze) | ענק רירי מים/רעל, 1500/400. בוס מרכזי ענק ששואב אליו אויבים |

---

## הכיוונים

### כיוון 1 — "מדבקות אלבום" (Sticker Album) 🏷️
העולם של המשחק הוא אלבום מדבקות — אז שהקלפים *יהיו* מדבקות. קו עבה, צבעים רוויים, מסגרת לבנה של מדבקה, הדפס מבריק.

**למה זה מתאים:** נאמן ל-GDD ("האלבום", "מדבקות מפלצות"), קריא מאוד במסך קטן, נוסטלגי-ישראלי.

```
Die-cut glossy sticker illustration of {MONSTER}, bold black outline, thick white
sticker border, vibrant saturated flat colors with simple cel shading, playful
90s trading-sticker album aesthetic, centered full-body character, three-quarter
front view, plain soft gradient background, high contrast, crisp vector-like edges,
no text, no logo --ar 1:1
```

### כיוון 2 — "קומיקס אפל" (Dark Comic) 🌑
העולם של הסרט — סמטאות חשוכות, תחנה נטושה, אמנדה. קווי דיו, צלליות דרמטיות, פלטה כהה עם נגיעות ניאון.

**למה זה מתאים:** בוגר ואטמוספרי, מתאים לעולם של איתמר ואמנדה, נראה "יקר".

```
Dark graphic-novel illustration of {MONSTER}, heavy inked linework, dramatic rim
lighting, moody desaturated palette with one neon accent color, gritty urban
underworld atmosphere, full-body character centered, three-quarter view, subtle
grain texture, dark vignette background, cinematic, no text --ar 1:1
```

### כיוון 3 — "צעצוע רך" (Soft Toy 3D) 🧸
עיבוד תלת-ממד רך ומעוגל, כמו צעצועי ויניל אספניים. תאורה נעימה, חומרים חלקים, מראה יקר ומודרני.

**למה זה מתאים:** נראה הכי "מקצועי/גדול" בחנויות אפליקציות, אהוב על ילדים, קל להוסיף לו אנימציה.

```
Cute stylized 3D render of {MONSTER} as a collectible vinyl toy figure, soft
rounded shapes, smooth matte materials, warm three-point studio lighting, subtle
subsurface glow, pastel-rich color palette, full-body centered, three-quarter view,
clean neutral studio background, octane render quality, no text --ar 1:1
```

### כיוון 4 — "פנטזיה מצוירת ביד" (Painted Fantasy) 🎨
איור צבעי-מים/גואש מצויר ביד, מכחול נראה לעין, חמים ואמנותי — כמו ספר אגדות.

**למה זה מתאים:** ייחודי ויפהפה, מרגיש "בעבודת יד" ולא AI גנרי.

```
Hand-painted fantasy illustration of {MONSTER}, visible gouache brush strokes,
warm storybook color palette, soft painterly edges, expressive character design,
full-body centered, three-quarter view, textured paper background, whimsical
children's book art style, no text --ar 1:1
```

---

## הפרומפטים המוכנים — העתק/הדבק 📋

החליפו `{MONSTER}` בתיאור המתאים. **הפעילו כל כיוון על שלושתן.**

**A. פליים דראגון:**
> `a fierce red-orange flame dragon with glowing molten scales, spread wings, sharp horns, fire wisps trailing from its jaws, aggressive charging pose`

**B. סליים בסיסי:**
> `a friendly gelatinous mud-brown slime blob creature with big round eyes, soft wobbly translucent body, small happy smile, tiny arms`

**C. זליג הענק:**
> `a colossal purple-green toxic ooze monster, massive towering gelatinous body, multiple glowing eyes, dripping slime tendrils, imposing boss creature`

**דוגמה מלאה (כיוון 1 + מפלצת A):**
```
Die-cut glossy sticker illustration of a fierce red-orange flame dragon with
glowing molten scales, spread wings, sharp horns, fire wisps trailing from its
jaws, aggressive charging pose, bold black outline, thick white sticker border,
vibrant saturated flat colors with simple cel shading, playful 90s trading-sticker
album aesthetic, centered full-body character, three-quarter front view, plain
soft gradient background, high contrast, crisp vector-like edges, no text,
no logo --ar 1:1
```

---

## מה לבדוק כשבוחרים ✅

- [ ] **קריאוּת בקטן:** מקטינים ל-100 פיקסלים — עדיין מזהים מה זה?
- [ ] **טווח:** הדרקון נראה מאיים *וגם* הסליים נראה חמוד? (סגנון שעובד רק על אחד — פוסל)
- [ ] **עקביות:** ההרצות באותו כיוון נראות כמו אותה משפחה?
- [ ] **גב לבן/נקי:** אפשר לבודד את הדמות מהרקע? (חשוב לעיבוד שלי)
- [ ] **טעם:** הוד אוהב את זה? זה המשחק שלכם 😊

---

## אחרי הבחירה

תגידו לי איזה כיוון בחרתם ואני:
1. אכתוב את **תנ״ך הסגנון** המלא (`docs/art-bible.md`)
2. אכתוב **תבנית לכל סדרה** (פלטה + מוטיב) — סבב בקרה #2
3. אכתוב **פרומפט מדויק לכל מפלצת** מתוך ה-GDD — סבב בקרה #3
4. אבנה את סקריפט העיבוד + אשלב במשחק
