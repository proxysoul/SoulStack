export interface Contributor {
  name: string;
  github: string;
}

export const SKILL_AUTHORS: Record<string, Contributor> = {
  marketing: { name: "Ismail Ghallou", github: "smakosh" },
};

export const profileUrl = (c: Contributor) => `https://github.com/${c.github}`;
export const avatarPath = (c: Contributor) => `/contributors/${c.github}.jpg`;
