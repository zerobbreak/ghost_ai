export type Project = {
  id: string;
  name: string;
  slug: string;
  owned: boolean;
};

export const MOCK_PROJECTS: Project[] = [
  { id: "1", name: "E-Commerce Platform", slug: "e-commerce-platform", owned: true },
  { id: "2", name: "Blog Engine", slug: "blog-engine", owned: true },
  { id: "3", name: "Team Dashboard", slug: "team-dashboard", owned: false },
];
