// Like a Python TypedDict — describes the shape of one repo object from the GitHub API
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

// Like: async def fetch_github_repos(username: str) -> list[GitHubRepo]
export async function fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Inject a PAT if provided — GitHub rate-limits unauthenticated requests to 60/hr
  if (process.env.GITHUB_TOKEN) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=public`,
    { headers, next: { revalidate: 300 } } // cache for 5 min — like functools.lru_cache(maxsize=1, ttl=300)
  );

  if (!res.ok) {
    throw new Error(
      `GitHub API error ${res.status}: ${await res.text()}`
    );
  }

  const data = await res.json() as GitHubRepo[];
  return data;
}
