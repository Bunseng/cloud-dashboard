/* ------------------------------------------------------------------ *
 * Container registries — the "Create Registry" flow from Figma
 * (fileKey EvjrpwXJD9JlayN1Ij5I4J, node 602:11514). Seven providers,
 * each with its own field set; saved registries are then offered as
 * "Registry Authentication" credentials wherever a service picks a
 * private image (Create Run App, and a stack's Create/Edit Service).
 *
 * SAVED_REGISTRIES is a shared module-level array (same pattern as
 * SAVED_CARDS in paymentMethods.ts) so a registry added from any one of
 * those three surfaces immediately shows up in the other two.
 * ------------------------------------------------------------------ */

export interface RegistryProvider {
  id: string;
  label: string;
  /* Accent used for the small provider badge — no real registry ships
     a usable brand SVG here, so each gets a flat colored initial badge
     instead of trying to reproduce a trademarked logo. */
  color: string;
}

export const REGISTRY_PROVIDERS: RegistryProvider[] = [
  { id: "docker", label: "Docker", color: "#0DB7ED" },
  { id: "aws-ecr", label: "AWS ECR", color: "#FF9900" },
  { id: "azure", label: "Azure", color: "#0078D4" },
  { id: "quay", label: "Quay.io", color: "#003764" },
  { id: "gitlab", label: "GitLab", color: "#FC6D26" },
  { id: "proget", label: "Proget", color: "#1C75BC" },
  { id: "custom", label: "Custom Registry", color: "#71717A" },
];

export interface RegistryField {
  key: string;
  label: string;
  required?: boolean;
  type?: "text" | "password" | "select";
  placeholder?: string;
  options?: string[];
}

/* Field set per provider, matching each Figma "Create Registry" variant. */
export const REGISTRY_FIELDS: Record<string, RegistryField[]> = {
  docker: [
    { key: "name", label: "Name", required: true, placeholder: "registry-hub.docker.com" },
    { key: "username", label: "Username", required: true, placeholder: "Username" },
    { key: "accessToken", label: "Access Token", required: true, type: "password", placeholder: "Access Token" },
  ],
  "aws-ecr": [
    { key: "name", label: "Name", required: true, placeholder: "registry-hub.docker.com" },
    { key: "registryUrl", label: "Registry URL", required: true, placeholder: "registry-hub.docker.com" },
    { key: "accessKey", label: "AWS Access Key", required: true, placeholder: "AWS Access Key" },
    { key: "secretAccessKey", label: "AWS Secret Access Key", required: true, type: "password", placeholder: "AWS Secret Access Key" },
    {
      key: "region",
      label: "Region",
      required: true,
      type: "select",
      options: ["us-west-1", "us-east-1", "ap-southeast-1", "ap-southeast-2"],
    },
  ],
  azure: [
    { key: "name", label: "Name", required: true, placeholder: "registry-hub.docker.com" },
    { key: "registryUrl", label: "Registry URL", required: true, placeholder: "registry-hub.docker.com" },
    { key: "username", label: "Username", required: true, placeholder: "Username" },
    { key: "password", label: "Password", required: true, type: "password", placeholder: "Access Token" },
  ],
  quay: [
    { key: "name", label: "Name", required: true, placeholder: "registry-hub.docker.com" },
    { key: "password", label: "Password", type: "password", placeholder: "Password" },
    { key: "organizationName", label: "Organization Name", required: true, placeholder: "registry-hub.docker.com" },
  ],
  gitlab: [
    { key: "username", label: "Username", placeholder: "Username" },
    { key: "accessToken", label: "Access Token", type: "password", placeholder: "Access Token" },
  ],
  proget: [
    { key: "name", label: "Name", required: true, placeholder: "registry-hub.docker.com" },
    { key: "registryUrl", label: "Registry URL", required: true, placeholder: "registry-hub.docker.com" },
    { key: "baseUrl", label: "Base URL", required: true, placeholder: "registry-hub.docker.com" },
    { key: "username", label: "Username", required: true, placeholder: "Username" },
    { key: "password", label: "Password", required: true, type: "password", placeholder: "Access Token" },
  ],
  custom: [
    { key: "registryUrl", label: "Registry URL", required: true, placeholder: "e.g. registry.hub.docker.com" },
    { key: "username", label: "Username", required: true, placeholder: "Username" },
    { key: "password", label: "Password", required: true, type: "password", placeholder: "Password" },
  ],
};

export interface SavedRegistry {
  id: string;
  provider: string;
  name: string;
  /* Short, non-sensitive summary shown in pickers — never the secret
     field itself (token/password), just what identifies the registry. */
  summary: string;
}

/* Seed empty — "Public" covers the common case, so nothing forces a
   registry to exist before a service can be created. */
export const SAVED_REGISTRIES: SavedRegistry[] = [];

export function addSavedRegistry(registry: SavedRegistry) {
  SAVED_REGISTRIES.push(registry);
}

export function removeSavedRegistry(id: string) {
  const i = SAVED_REGISTRIES.findIndex((r) => r.id === id);
  if (i !== -1) SAVED_REGISTRIES.splice(i, 1);
}
