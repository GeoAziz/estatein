# Exact-Fidelity Data — 18 Screens

Pulled directly from the Figma REST API (`/v1/files/{key}/nodes`), full node trees,
to supplement the shallow inventory in the main spec. Each file below covers one
of the 18 real top-level screens (6 pages × Desktop/Laptop/Mobile).

Each JSON has two arrays:
- `texts` — every real text string on the screen, with path (breadcrumb), font family/weight/size, line height, letter spacing, alignment, and color hex.
- `layoutSpecs` — every frame/group/rectangle with non-default padding, gap (`itemSpacing`), corner radius, stroke, or opacity, with its path and rendered width/height.

| Screen | Node ID | File | Texts | Layout Specs |
|---|---|---|---|---|
| Home Page - Desktop | 46:304 | `home-page-desktop__46-304.json` | 134 | 159 |
| About Us Page - Desktop | 89:5151 | `about-us-page-desktop__89-5151.json` | 118 | 147 |
| Properties Page - Desktop | 97:7288 | `properties-page-desktop__97-7288.json` | 94 | 125 |
| Property Details Page - Desktop | 102:8754 | `property-details-page-desktop__102-8754.json` | 140 | 182 |
| Services Page - Desktop | 104:10350 | `services-page-desktop__104-10350.json` | 82 | 120 |
| Contact Page - Desktop | 104:12305 | `contact-page-desktop__104-12305.json` | 84 | 109 |
| Home Page - Laptop | 139:6238 | `home-page-laptop__139-6238.json` | 134 | 159 |
| About Us Page - Laptop | 143:9031 | `about-us-page-laptop__143-9031.json` | 118 | 147 |
| Properties Page - Laptop | 149:12282 | `properties-page-laptop__149-12282.json` | 94 | 125 |
| Services Page - Laptop | 170:2308 | `services-page-laptop__170-2308.json` | 82 | 120 |
| Contact Page - Laptop | 172:5138 | `contact-page-laptop__172-5138.json` | 84 | 109 |
| Property Details Page - Laptop | 165:2 | `property-details-page-laptop__165-2.json` | 140 | 182 |
| Home Page - Mobile | 139:7812 | `home-page-mobile__139-7812.json` | 99 | 109 |
| About Us Page - Mobile | 146:10636 | `about-us-page-mobile__146-10636.json` | 95 | 123 |
| Properties Page - Mobile | 150:13561 | `properties-page-mobile__150-13561.json` | 76 | 101 |
| Services Page - Mobile | 172:3548 | `services-page-mobile__172-3548.json` | 77 | 116 |
| Contact Page - Mobile | 172:6494 | `contact-page-mobile__172-6494.json` | 79 | 110 |
| Property Details Page - Mobile | 170:1233 | `property-details-page-mobile__170-1233.json` | 129 | 162 |

Icons (7,442 vectors) still need manual SVG export from Figma — geometry alone
isn't enough to reproduce nested vector paths reliably, and the community-file
PAT tier doesn't grant the images/export endpoint for this project.
