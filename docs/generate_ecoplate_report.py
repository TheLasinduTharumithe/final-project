from __future__ import annotations

import html
import subprocess
import tempfile
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs"
HTML_PATH = OUT_DIR / "EcoPlate_Full_Project_Explanation.html"
PDF_PATH = OUT_DIR / "EcoPlate_Full_Project_Explanation.pdf"


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def slug(value: str) -> str:
    return "".join(ch.lower() if ch.isalnum() else "-" for ch in value).strip("-")


def p(text: str) -> str:
    return f"<p>{esc(text)}</p>"


def bullets(items: list[str]) -> str:
    return "<ul>" + "".join(f"<li>{esc(item)}</li>" for item in items) + "</ul>"


def numbered(items: list[str]) -> str:
    return "<ol>" + "".join(f"<li>{esc(item)}</li>" for item in items) + "</ol>"


def table(headers: list[str], rows: list[list[str]], class_name: str = "") -> str:
    head = "".join(f"<th>{esc(item)}</th>" for item in headers)
    body = "\n".join(
        "<tr>" + "".join(f"<td>{esc(cell)}</td>" for cell in row) + "</tr>" for row in rows
    )
    klass = f' class="{class_name}"' if class_name else ""
    return f"<table{klass}><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>"


def section(title: str, body: str) -> str:
    return f'<section id="{slug(title)}"><h2>{esc(title)}</h2>{body}</section>'


def code_path(path: str) -> str:
    return f"<code>{esc(path)}</code>"


def find_chrome() -> Path | None:
    candidates = [
        Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
        Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
        Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
    ]
    return next((path for path in candidates if path.exists()), None)


def render_pdf() -> None:
    browser = find_chrome()
    if browser is None:
        raise RuntimeError("Chrome or Edge was not found; HTML was generated but PDF was not rendered.")

    if PDF_PATH.exists():
        PDF_PATH.unlink()

    with tempfile.TemporaryDirectory(prefix="ecoplate-pdf-") as profile_dir:
        subprocess.run(
            [
                str(browser),
                "--headless=new",
                "--disable-gpu",
                "--disable-extensions",
                "--no-first-run",
                "--no-default-browser-check",
                f"--user-data-dir={profile_dir}",
                "--no-pdf-header-footer",
                f"--print-to-pdf={PDF_PATH}",
                HTML_PATH.as_uri(),
            ],
            check=True,
            cwd=ROOT,
            timeout=60,
        )


def main() -> None:
    OUT_DIR.mkdir(exist_ok=True)

    toc_titles = [
        "Executive Summary",
        "Problem and Project Aim",
        "Users and Role Permissions",
        "System Architecture",
        "Main User Workflows",
        "Feature Explanation",
        "Data Model",
        "Security and Access Control",
        "Codebase Structure",
        "Important File Responsibilities",
        "Setup and Configuration",
        "Testing and Build Checks",
        "Limitations and Future Improvements",
        "Conclusion",
    ]

    route_rows = [
        ["/", "Public landing page", "Shows the EcoPlate pitch and public paid/published advertisements."],
        ["/register", "Registration", "Creates restaurant or charity accounts with profile, avatar, and license/certificate data."],
        ["/login", "Login", "Authenticates approved users through email/password or Google sign-in."],
        ["/dashboard", "Role dashboard", "Redirects admins to /admin and shows restaurant or charity metrics for approved users."],
        ["/donations", "Donation list", "Restaurants manage their posts; charities browse available donations."],
        ["/donations/new", "New donation", "Restaurant-only form for creating a donation with quantity, image, expiry, and map location."],
        ["/donations/[id]", "Donation details", "Displays one donation, supports restaurant editing/status changes and charity requests."],
        ["/requests", "Request workflow", "Restaurants approve/reject incoming requests; charities track their own request status."],
        ["/ads", "Public advertisements", "Displays ads after payment and publishing approval."],
        ["/ads/new", "Create ad", "Restaurant-only advertisement submission flow."],
        ["/ads/my", "My ads", "Restaurant ad tracking page for payment, review, and publishing state."],
        ["/admin", "Admin dashboard", "Admin-only overview for users, donations, requests, ads, and destructive controls."],
        ["/admin/pending-approvals", "Approval queue", "Admin-only review of pending restaurant and charity accounts."],
        ["/admin/ads", "Ad moderation", "Admin-only payment, approval, rejection, and publishing controls."],
        ["/chat", "AI assistant", "EcoPlate chatbot page backed by a Next.js API route and Gemini."],
        ["/profile", "Profile", "Authenticated user profile view and edit page."],
        ["/api/chat", "Chat API", "Verifies Firebase ID token, gathers facts when needed, and asks Gemini for a reply."],
        ["/api/send-donation-email", "Email API", "Sends new-donation emails to approved charities through Brevo."],
    ]

    data_rows = [
        [
            "users",
            "Stores Firebase Auth profile data and EcoPlate role metadata.",
            "id, name, email, phone, address, role, avatar64, licenseFile, approvalStatus, isApproved, createdAt",
            "role: restaurant, charity, admin; approvalStatus: pending, approved, rejected",
        ],
        [
            "donations",
            "Stores food donation posts created by restaurants.",
            "restaurantId, foodName, quantity, totalQuantity, remainingQuantity, requestedQuantity, pickupLocation, pickupTime, expiryDate, expiryTime, expiresAt, status, image64, latitude, longitude, locationText, createdAt",
            "available, requested, completed, cancelled, expired",
        ],
        [
            "requests",
            "Stores charity pickup requests for donation posts.",
            "donationId, restaurantId, charityId, charityName, message, requestedQuantity, status, createdAt",
            "pending, approved, rejected",
        ],
        [
            "ads",
            "Stores restaurant advertisement submissions.",
            "title, description, imageUrl, restaurantId, contactNumber, paymentStatus, status, createdAt",
            "paymentStatus: pending, paid; status: pending, approved, rejected, published",
        ],
    ]

    service_rows = [
        [
            "src/lib/auth.ts",
            "Wraps Firebase Authentication, creates app profiles, blocks pending/rejected accounts, and redirects roles.",
        ],
        [
            "src/services/users.ts",
            "Manages user profiles, role validation, admin approval/rejection, pending-user subscriptions, and user counts.",
        ],
        [
            "src/services/donations.ts",
            "Creates and updates donation records, filters available donations, subscribes to real-time donation data, and marks expired posts.",
        ],
        [
            "src/services/requests.ts",
            "Creates pickup requests and uses Firestore transactions to approve or reject requests without corrupting quantities.",
        ],
        [
            "src/services/ads.ts",
            "Creates restaurant ads, lists restaurant/admin/public ads, and updates payment/review/publish states.",
        ],
        [
            "src/services/chatbot.ts",
            "Detects chat intent, enforces role restrictions, reads Firestore facts through REST, and sends context to Gemini.",
        ],
        [
            "src/lib/gemini.ts",
            "Holds Gemini prompt behavior for general and database-backed chatbot answers.",
        ],
        [
            "src/lib/firebase.ts",
            "Initializes the client Firebase app, Authentication, Firestore, and Storage from environment variables.",
        ],
        [
            "src/lib/firebase-admin.ts",
            "Lazily initializes Firebase Admin for privileged server-side routes such as email notifications.",
        ],
        [
            "src/lib/image.ts",
            "Validates and processes uploaded images for avatars, donations, and advertisements.",
        ],
    ]

    component_rows = [
        ["ProtectedRoute.tsx", "Client-side guard for login, allowed roles, and approval requirements."],
        ["AppShell.tsx, Navbar.tsx, Sidebar.tsx", "Application frame, navigation, workspace shell, and authenticated navigation state."],
        ["WorkspaceUI.tsx", "Reusable dashboard cards, page headers, loading skeletons, and state panels."],
        ["DonationForm.tsx, DonationCard.tsx", "Donation creation/edit form and reusable donation display card."],
        ["DonationLocationMap.tsx, LocationPickerMap.tsx", "Leaflet map components for pickup selection and route display."],
        ["RequestCard.tsx", "Reusable view for request details and restaurant approval actions."],
        ["AdForm.tsx, AdCard.tsx, HomepageAds.tsx", "Advertisement submission, card display, and landing-page ad carousel."],
        ["ImageUpload.tsx, AvatarUpload.tsx, FileUpload.tsx", "Reusable file inputs with preview, validation, and base64 handling."],
        ["ChatBox.tsx", "Chat interface that sends messages to /api/chat and displays the assistant reply."],
        ["ExpirationService.tsx", "Background client helper that can clean up expired donations for allowed users."],
    ]

    workflow_cards = [
        (
            "Restaurant Donation Flow",
            [
                "A restaurant registers and waits for admin approval.",
                "After approval, the restaurant creates a donation with quantity, pickup time, expiry, image, and location.",
                "Approved charities browse available donations and submit pickup requests.",
                "The restaurant approves or rejects requests.",
                "When a request is approved, the remaining quantity is reduced transactionally. If nothing remains, the donation becomes completed.",
            ],
        ),
        (
            "Charity Pickup Flow",
            [
                "A charity registers with certificate data and waits for admin approval.",
                "The charity dashboard subscribes to available donations and the charity's request list.",
                "The charity opens a donation detail page, checks location guidance, enters requested quantity, and sends a message.",
                "The request appears as pending until the restaurant approves or rejects it.",
                "Approved requests become a pickup schedule for the charity.",
            ],
        ),
        (
            "Admin Moderation Flow",
            [
                "An admin account is created by changing a Firestore user role to admin.",
                "The admin dashboard summarizes users, donations, requests, and ads.",
                "Pending restaurant and charity accounts are approved or rejected.",
                "Advertisement submissions are reviewed, payment status is marked, and qualified ads are published.",
                "Admin rules also permit cleanup and management actions that ordinary users cannot perform.",
            ],
        ),
    ]

    sections = []
    sections.append(
        section(
            "Executive Summary",
            p(
                "EcoPlate is a production-style food donation web application that connects restaurants with charities. Restaurants can post surplus food, charities can request pickup quantities, and admins moderate accounts and advertisements. The system is built with Next.js App Router, React, TypeScript, Tailwind CSS, Firebase Authentication, Cloud Firestore, Firebase Storage, Gemini, and Brevo email."
            )
            + '<div class="stat-grid">'
            + "".join(
                f'<div class="stat"><strong>{esc(value)}</strong><span>{esc(label)}</span></div>'
                for value, label in [
                    ("3", "core user roles"),
                    ("4", "main Firestore collections"),
                    ("18", "route/API surfaces"),
                    ("Next.js 16", "front-end framework"),
                ]
            )
            + "</div>"
            + p(
                "This document explains the project as a final-project style report. It covers the purpose, architecture, functional modules, role workflows, data model, security rules, important files, setup steps, and recommended improvements."
            ),
        )
    )

    sections.append(
        section(
            "Problem and Project Aim",
            p(
                "Restaurants often have usable surplus food, while charities need dependable ways to find and collect donations. Without a structured platform, pickup coordination can become slow, manual, and difficult to audit. EcoPlate addresses this by providing a role-based digital workflow for posting food, requesting quantities, managing pickup decisions, and notifying approved charities."
            )
            + "<h3>Project Objectives</h3>"
            + bullets(
                [
                    "Reduce food waste by making available restaurant donations visible to approved charities.",
                    "Protect operational access through Firebase Authentication and admin approval gates.",
                    "Track donation quantities so charities cannot request more than the remaining amount.",
                    "Support pickup coordination with location, expiry, and request-status information.",
                    "Allow restaurants to publish paid advertisements after admin review.",
                    "Provide AI guidance through an EcoPlate chatbot that can answer both general and database-aware questions.",
                ]
            )
            + "<h3>Scope</h3>"
            + p(
                "The project focuses on food donation coordination, account approval, advertisement moderation, and basic AI assistance. It does not implement full payment processing, logistics dispatch, advanced inventory forecasting, or native mobile apps; those are suitable future enhancements."
            ),
        )
    )

    sections.append(
        section(
            "Users and Role Permissions",
            p(
                "EcoPlate has three roles: restaurant, charity, and admin. Restaurant and charity accounts are public registration roles, but they start as pending accounts. Admin accounts are deliberately not self-service; a user document must be promoted to admin inside Firestore."
            )
            + table(
                ["Role", "Main Permissions", "Restricted From"],
                [
                    [
                        "Restaurant",
                        "Create donations, edit own donations, review requests for own donations, submit and track ads.",
                        "Admin dashboard, approval queues, other restaurants' private records.",
                    ],
                    [
                        "Charity",
                        "Browse available donations, request pickup quantities, track own requests, use the chatbot.",
                        "Creating donations, approving requests, managing advertisements.",
                    ],
                    [
                        "Admin",
                        "Approve/reject users, view platform stats, moderate ads, manage users and records.",
                        "Public self-registration; admin role is assigned manually for security.",
                    ],
                ],
            )
            + '<div class="note"><strong>Approval gate:</strong> login can succeed at Firebase level while EcoPlate still blocks the user if their Firestore profile is pending or rejected.</div>',
        )
    )

    sections.append(
        section(
            "System Architecture",
            p(
                "EcoPlate uses a client-heavy Next.js App Router structure with Firebase services as the main backend. Most CRUD operations are performed from client components through Firestore service modules. Server-side API routes are used for chatbot requests and donation notification emails."
            )
            + '<div class="diagram">'
            + '<div><strong>Browser UI</strong><span>Next.js pages, React components, Tailwind styles</span></div>'
            + '<b>-></b><div><strong>Service Layer</strong><span>auth, users, donations, requests, ads, chatbot</span></div>'
            + '<b>-></b><div><strong>Firebase</strong><span>Auth, Firestore, Storage, Admin SDK</span></div>'
            + '<b>+</b><div><strong>External APIs</strong><span>Gemini for chat, Brevo for email</span></div>'
            + "</div>"
            + "<h3>Technology Stack</h3>"
            + table(
                ["Layer", "Technology", "Purpose"],
                [
                    ["Application framework", "Next.js 16 App Router", "Routing, pages, API routes, production build."],
                    ["UI runtime", "React 19 and TypeScript", "Interactive client components with typed models."],
                    ["Styling", "Tailwind CSS", "Responsive design, utility classes, reusable visual patterns."],
                    ["Authentication", "Firebase Authentication", "Email/password and Google sign-in."],
                    ["Database", "Cloud Firestore", "Users, donations, requests, advertisements, and realtime listeners."],
                    ["Storage/uploads", "Firebase Storage and base64 helpers", "Ad images plus base64 image handling for avatars and donations."],
                    ["AI assistant", "Gemini API", "General help and database-aware answers through controlled prompts."],
                    ["Email", "Brevo Transactional Email API", "New donation notification emails to approved charities."],
                    ["Maps", "Leaflet and React Leaflet", "Donation pickup selection and route/location display."],
                ],
            ),
        )
    )

    workflow_body = "".join(
        '<div class="workflow-card"><h3>'
        + esc(title)
        + "</h3>"
        + numbered(steps)
        + "</div>"
        for title, steps in workflow_cards
    )
    sections.append(section("Main User Workflows", '<div class="workflow-grid">' + workflow_body + "</div>"))

    sections.append(
        section(
            "Feature Explanation",
            "<h3>Authentication and Approval</h3>"
            + p(
                "Users register as either restaurant or charity. The registration page requires organization details and a license or certificate upload. New accounts are written to the users collection with approvalStatus set to pending, then the user is signed out until an admin approves the account."
            )
            + "<h3>Donation Management</h3>"
            + p(
                "Restaurants create donation posts with food details, total quantity, remaining quantity, pickup information, expiry information, optional image, and map coordinates. Available donations are filtered so expired posts do not remain visible to charities."
            )
            + "<h3>Request Management</h3>"
            + p(
                "Charities request a specific quantity from an available donation. The request service prevents duplicate active requests and uses Firestore transactions during approval so the remaining quantity and request status update together."
            )
            + "<h3>Advertisement Publishing</h3>"
            + p(
                "Restaurants submit ads with pending payment and pending review status. Public ad surfaces only show records where paymentStatus is paid and status is published. Admins control the review, payment, and publishing states."
            )
            + "<h3>AI Chatbot</h3>"
            + p(
                "The chatbot detects the user's language mode and intent. General questions go directly to Gemini. Database questions first collect role-appropriate facts from Firestore, then Gemini formats the answer. Role restrictions prevent a user from asking for data they should not see."
            )
            + "<h3>Email Notifications</h3>"
            + p(
                "The donation email API sends new-donation notifications to approved charities. It prefers the Firebase Admin SDK for authoritative charity lookup and can fall back to a client-provided charity list during local development."
            ),
        )
    )

    sections.append(
        section(
            "Data Model",
            p("The core database model is intentionally simple and suitable for a student or early production project.")
            + table(["Collection", "Purpose", "Important Fields", "Status Values"], data_rows, "wide-table"),
        )
    )

    sections.append(
        section(
            "Security and Access Control",
            p(
                "Security is enforced in two places: UI route guards and Firebase security rules. The UI improves user experience by redirecting users away from pages they cannot use. Firestore and Storage rules are still the authoritative protection layer."
            )
            + "<h3>Firestore Rules Summary</h3>"
            + bullets(
                [
                    "Only signed-in users can read user profiles; users may update their own non-role, non-approval fields, while admins can manage all users.",
                    "Donation reads require an approved account. Restaurants can create and update their own donations; admins have broader management rights.",
                    "Request reads are limited to admins, the charity that created the request, or the restaurant that owns the related donation.",
                    "Only charities can create requests. Restaurants can update request decisions for their own donations without changing immutable request fields.",
                    "Ads are public only when paid and published. Restaurants can create and edit their own ads without changing protected review/payment fields. Admins moderate ads.",
                ]
            )
            + "<h3>Storage Rules Summary</h3>"
            + p(
                "The storage rules allow public reading of restaurant ad images while writes are limited to authenticated users uploading image content under their own restaurant folder."
            )
            + '<div class="note"><strong>Security note:</strong> environment variables are documented by key name only. Secret values from .env.local should never be copied into reports, screenshots, Git commits, or public deployments.</div>',
        )
    )

    sections.append(
        section(
            "Codebase Structure",
            p("The project follows a readable Next.js layout where routes, components, services, libraries, styles, and shared types are separated.")
            + '<pre class="tree">src/\n  app/                 Next.js pages and API routes\n  components/          Reusable UI and workflow components\n  lib/                 Firebase, auth, image, email, Gemini, chat helpers\n  services/            Firestore-facing data access modules\n  styles/              Global Tailwind/CSS styles\n  templates/email/     Donation email HTML template\n  types/               Shared TypeScript data models\npublic/                Static assets\nfirestore.rules        Firestore role and ownership rules\nstorage.rules          Firebase Storage image rules</pre>'
            + table(["Route/API", "Purpose", "Explanation"], route_rows, "wide-table"),
        )
    )

    sections.append(
        section(
            "Important File Responsibilities",
            "<h3>Service and Library Files</h3>"
            + table(["File", "Responsibility"], service_rows, "wide-table")
            + "<h3>Component Files</h3>"
            + table(["Component", "Responsibility"], component_rows, "wide-table")
            + "<h3>Configuration Files</h3>"
            + table(
                ["File", "Responsibility"],
                [
                    ["package.json", "Project scripts and dependencies. Main scripts are dev, build, start, and typecheck."],
                    ["next.config.ts", "Next.js configuration, including remote image allowances if used by the app."],
                    ["tailwind.config.ts", "Tailwind theme extension and source scanning paths."],
                    ["postcss.config.js", "PostCSS setup for Tailwind processing."],
                    ["tsconfig.json", "TypeScript compiler settings and path aliases."],
                    [".gitignore", "Prevents generated dependencies, build output, environment files, and local artifacts from entering Git."],
                    ["firestore.rules", "Database authorization rules for users, donations, requests, and ads."],
                    ["storage.rules", "Firebase Storage rules for advertisement image uploads."],
                ],
                "wide-table",
            ),
        )
    )

    env_keys = [
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
        "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
        "NEXT_PUBLIC_FIREBASE_APP_ID",
        "NEXT_PUBLIC_SITE_URL",
        "GEMINI_API_KEY",
        "FIREBASE_PROJECT_ID",
        "FIREBASE_CLIENT_EMAIL",
        "FIREBASE_PRIVATE_KEY",
        "BREVO_API_KEY",
        "BREVO_SENDER_EMAIL",
        "BREVO_SENDER_NAME",
    ]
    sections.append(
        section(
            "Setup and Configuration",
            "<h3>Local Setup</h3>"
            + '<pre class="commands">npm install\nnpm run dev\nnpm run typecheck\nnpm run build</pre>'
            + p("After starting the development server, open http://localhost:3000.")
            + "<h3>Required Environment Variables</h3>"
            + p("The project uses these keys. Keep actual values private and store them in .env.local or the deployment provider's environment settings.")
            + '<div class="env-grid">'
            + "".join(f"<code>{esc(key)}</code>" for key in env_keys)
            + "</div>"
            + "<h3>Firebase Setup Checklist</h3>"
            + numbered(
                [
                    "Create a Firebase project.",
                    "Enable Email/Password sign-in and configure Google sign-in if required.",
                    "Create a Cloud Firestore database.",
                    "Create a Firebase Storage bucket.",
                    "Copy Firebase web app config values into the public Firebase environment keys.",
                    "Deploy firestore.rules and storage.rules.",
                    "Register one restaurant and one charity through the UI.",
                    "Manually promote an account to admin by changing that user's role in Firestore.",
                    "Configure Gemini and Brevo keys for chatbot and email features.",
                ]
            ),
        )
    )

    sections.append(
        section(
            "Testing and Build Checks",
            p(
                "The project includes TypeScript and production build checks. These checks verify static typing and whether Next.js can build the app successfully."
            )
            + table(
                ["Command", "Purpose"],
                [
                    ["npm run typecheck", "Runs TypeScript without emitting files. Use after service, type, and component changes."],
                    ["npm run build", "Creates a production Next.js build and catches framework/runtime build issues."],
                    ["npm run dev", "Runs the local development server for manual UI verification."],
                ],
            )
            + "<h3>Suggested Manual Test Cases</h3>"
            + bullets(
                [
                    "Register a restaurant and confirm it cannot access protected pages until admin approval.",
                    "Approve the restaurant from the admin approval queue.",
                    "Create a donation with quantity, image, expiry, and map location.",
                    "Register and approve a charity, then request part of the available quantity.",
                    "Approve the request and confirm remainingQuantity decreases correctly.",
                    "Submit a restaurant ad, then approve, mark paid, and publish it from the admin ad page.",
                    "Ask the chatbot for general guidance and role-specific database facts.",
                    "Run typecheck and build before final submission.",
                ]
            ),
        )
    )

    sections.append(
        section(
            "Limitations and Future Improvements",
            "<h3>Current Limitations</h3>"
            + bullets(
                [
                    "Payment handling is represented by paymentStatus fields rather than a real payment gateway.",
                    "Email notifications depend on Brevo configuration and approved charity email data.",
                    "Some image data is stored as base64, which is simple but less scalable than fully object-storage-based uploads.",
                    "The chatbot reads a limited number of Firestore records for safety and simplicity.",
                    "Restaurant request real-time support is partially simplified compared with a fully denormalized backend.",
                ]
            )
            + "<h3>Recommended Enhancements</h3>"
            + bullets(
                [
                    "Integrate a real payment provider for advertisement payments.",
                    "Move all user-uploaded images to Firebase Storage and store only URLs in Firestore.",
                    "Add Cloud Functions for donation expiry cleanup, notification automation, and denormalized counters.",
                    "Add formal unit/integration tests for service functions and role-based access behavior.",
                    "Add analytics for meals rescued, food categories, pickup completion rates, and charity impact.",
                    "Improve logistics with route optimization, pickup reminders, and status timestamps.",
                    "Add audit logs for admin approvals, ad publishing, and request decisions.",
                ]
            ),
        )
    )

    sections.append(
        section(
            "Conclusion",
            p(
                "EcoPlate is a clear final-project example of a role-based, full-stack web application. It combines a modern Next.js interface with Firebase authentication, Firestore data modeling, security rules, maps, email notifications, and AI assistance. The strongest parts of the implementation are its separated service layer, typed data models, approval workflow, transaction-safe request approval, and practical admin moderation tools."
            )
            + p(
                "With payment integration, deeper automated tests, storage-based media handling, and server-side automation through Cloud Functions, the project can grow from a strong academic prototype into a more scalable operational platform."
            ),
        )
    )

    toc = "<ol>" + "".join(f'<li><a href="#{slug(title)}">{esc(title)}</a></li>' for title in toc_titles) + "</ol>"
    generated = date.today().isoformat()

    html_doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>EcoPlate Full Project Explanation</title>
<style>
@page {{ size: A4; margin: 14mm 13mm; }}
* {{ box-sizing: border-box; }}
body {{
  margin: 0;
  font-family: Calibri, Arial, sans-serif;
  color: #1f2937;
  background: #ffffff;
  font-size: 10.7pt;
  line-height: 1.42;
}}
.cover {{
  min-height: 94vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 6mm 0;
  break-after: page;
}}
.cover-bar {{
  width: 78px;
  height: 7px;
  background: linear-gradient(90deg, #2e7d32, #1e40af, #d97706);
  border-radius: 99px;
  margin-bottom: 18px;
}}
.eyebrow {{
  margin: 0 0 12px;
  color: #2e7d32;
  font-size: 9pt;
  font-weight: 700;
  letter-spacing: .13em;
  text-transform: uppercase;
}}
h1 {{
  margin: 0;
  color: #0f2f23;
  font-size: 31pt;
  line-height: 1.06;
  letter-spacing: 0;
}}
.subtitle {{
  max-width: 680px;
  margin: 14px 0 0;
  color: #4b5563;
  font-size: 13pt;
  line-height: 1.45;
}}
.cover-meta {{
  margin-top: 28px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}}
.cover-meta div {{
  border: 1px solid #d6dde6;
  border-radius: 8px;
  padding: 11px 12px;
  background: #fafafa;
}}
.cover-meta strong {{
  display: block;
  color: #111827;
  margin-bottom: 3px;
}}
.toc-page {{
  break-after: page;
}}
.toc-page ol {{
  columns: 2;
  margin: 0;
  padding-left: 20px;
}}
.toc-page li {{
  margin-bottom: 7px;
}}
a {{ color: #1f6f43; text-decoration: none; }}
section {{
  break-inside: auto;
  margin-bottom: 16px;
}}
h2 {{
  break-after: avoid;
  color: #1e40af;
  font-size: 17pt;
  line-height: 1.15;
  margin: 20px 0 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #d7e4f2;
}}
h3 {{
  break-after: avoid;
  color: #0f2f23;
  font-size: 12pt;
  margin: 13px 0 5px;
}}
p {{
  margin: 0 0 7px;
}}
ul, ol {{
  margin: 4px 0 8px 20px;
  padding: 0;
}}
li {{
  margin: 0 0 4px;
}}
table {{
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0 13px;
  break-inside: auto;
}}
thead {{ display: table-header-group; }}
tr {{ break-inside: avoid; }}
th, td {{
  border: 1px solid #d8dee8;
  padding: 7px 8px;
  vertical-align: top;
}}
th {{
  background: #f2f4f7;
  color: #0b2545;
  font-weight: 700;
  text-align: left;
}}
td {{
  overflow-wrap: break-word;
}}
.wide-table td, .wide-table th {{
  font-size: 9.6pt;
  line-height: 1.34;
}}
code {{
  font-family: Consolas, "Courier New", monospace;
  font-size: 9.2pt;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 1px 4px;
}}
.tree, .commands {{
  white-space: pre-wrap;
  font-family: Consolas, "Courier New", monospace;
  font-size: 9.8pt;
  line-height: 1.38;
  border: 1px solid #d8dee8;
  border-left: 4px solid #2e7d32;
  border-radius: 7px;
  background: #fbfcfd;
  padding: 10px 12px;
  margin: 8px 0 13px;
}}
.stat-grid {{
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 12px 0 14px;
}}
.stat {{
  border: 1px solid #d6dde6;
  border-radius: 7px;
  padding: 10px;
  background: #fbfcfd;
}}
.stat strong {{
  display: block;
  color: #2e7d32;
  font-size: 17pt;
  line-height: 1;
}}
.stat span {{
  display: block;
  margin-top: 4px;
  color: #4b5563;
  font-size: 9.3pt;
}}
.diagram {{
  display: grid;
  grid-template-columns: 1fr 20px 1fr 20px 1fr 20px 1fr;
  align-items: stretch;
  gap: 7px;
  margin: 12px 0 15px;
}}
.diagram div {{
  border: 1px solid #cfd8e5;
  border-radius: 7px;
  padding: 9px;
  background: #f8fafc;
}}
.diagram b {{
  align-self: center;
  color: #1e40af;
  text-align: center;
}}
.diagram strong {{
  display: block;
  color: #0b2545;
}}
.diagram span {{
  display: block;
  color: #4b5563;
  font-size: 9.2pt;
  margin-top: 3px;
}}
.workflow-grid {{
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}}
.workflow-card {{
  border: 1px solid #d8dee8;
  border-radius: 8px;
  padding: 10px 12px;
  background: #ffffff;
  break-inside: avoid;
}}
.workflow-card h3 {{
  margin-top: 0;
}}
.note {{
  border: 1px solid #f1d08a;
  border-left: 4px solid #d97706;
  background: #fff8e6;
  border-radius: 7px;
  padding: 9px 11px;
  margin: 10px 0 13px;
}}
.env-grid {{
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin: 8px 0 13px;
}}
.env-grid code {{
  display: block;
  padding: 6px 8px;
}}
.footer {{
  color: #6b7280;
  border-top: 1px solid #e5e7eb;
  margin-top: 18px;
  padding-top: 8px;
  font-size: 9pt;
}}
@media print {{
  .cover {{ break-after: page; }}
  .toc-page {{ break-after: page; }}
}}
</style>
</head>
<body>
<main>
  <div class="cover">
    <div class="cover-bar"></div>
    <p class="eyebrow">EcoPlate project documentation</p>
    <h1>Full Project Explanation Report</h1>
    <p class="subtitle">A complete explanatory PDF for the EcoPlate food donation platform, covering purpose, architecture, workflows, data model, security, setup, and important code files.</p>
    <div class="cover-meta">
      <div><strong>Project</strong>EcoPlate food donation and charity pickup platform</div>
      <div><strong>Generated</strong>{esc(generated)}</div>
      <div><strong>Stack</strong>Next.js, React, TypeScript, Firebase, Tailwind CSS, Gemini, Brevo</div>
      <div><strong>Source</strong>{esc(ROOT.name)} repository files</div>
    </div>
  </div>
  <section class="toc-page">
    <h2>Table of Contents</h2>
    {toc}
  </section>
  {''.join(sections)}
  <div class="footer">EcoPlate project explanation report. Generated from repository source files; no source-code behavior was changed.</div>
</main>
</body>
</html>
"""

    HTML_PATH.write_text(html_doc, encoding="utf-8")
    render_pdf()
    print(f"Wrote {HTML_PATH}")
    print(f"Wrote {PDF_PATH}")


if __name__ == "__main__":
    main()
