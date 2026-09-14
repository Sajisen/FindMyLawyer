# FindMyLawyer

FindMyLawyer is a lawyer discovery web application designed to help people in Sri Lanka find suitable legal professionals more easily.

The platform allows users to search for lawyers by legal area, preferred location, and other useful preferences. Users who are unsure which legal category matches their situation can also use Advanced Search to describe their problem in plain language and receive a suggested search category.

## Main Features

- Search for lawyers by area of practice and location.
- Refine results using additional search filters.
- View detailed lawyer profiles and contact information.
- Save lawyers for later.
- Guest users can save lawyers locally without creating an account.
- Registered users can keep their saved lawyers across sessions.
- Advanced Search can suggest a suitable legal category from a user's description.
- Lawyers can register and manage their professional profiles.
- Lawyer profile changes that require verification can be reviewed by an administrator.
- Administrators can review lawyer applications and manage relevant platform records.

> FindMyLawyer is a prototype. Lawyer profiles used for demonstration may contain fictional sample data. Advanced Search helps users choose a search category and does not provide legal advice.

## Running the Project Locally

### 1. Clone the repository

```bash
git clone <repository-url>
cd FindMyLawyer
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file using `.env.example` as a reference and add the required local environment values.

Then start the backend:

```bash
npm run dev
```

The backend normally runs on:

```text
http://localhost:5000
```

### 3. Set up the frontend

Open another terminal from the project root:

```bash
cd client
npm install
npm run dev
```

The frontend normally runs on:

```text
http://localhost:5173
```

Open that address in your browser to use FindMyLawyer locally.

## Project Status

FindMyLawyer is under active development. The current prototype includes the main lawyer search flow, lawyer profiles, saved lawyers, account functionality, lawyer registration and profile management, administrator review features, and AI-assisted category suggestions.
