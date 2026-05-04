export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  visibility: string;
  topics: string[];
}

// Token priority:
//   1. providerToken — user's live GitHub OAuth token from their session (5 000 req/hr)
//   2. GITHUB_TOKEN env var — server-side PAT (5 000 req/hr)
//   3. Unauthenticated — 60 req/hr, public repos only
export async function fetchGitHubRepos(
  username: string,
  providerToken?: string | null
): Promise<GitHubRepo[]> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const token = providerToken ?? process.env.GITHUB_TOKEN ?? null;
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=public`,
    { headers, next: { revalidate: 300 } }
  );

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<GitHubRepo[]>;
}
