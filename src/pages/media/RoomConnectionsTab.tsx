import { Eye, EyeOff, TriangleAlert, WandSparkles } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { CopyField } from "../../media/CopyField";
import { protocolIcons } from "../../media/protocolIcons";
import {
  useSignedEndpoint,
  useSigningState,
  type SigningState,
} from "../../media/useSignedEndpoint";
import {
  ingestProtocols,
  playbackFormats,
  playbackUrls,
  publishUrls,
  signingDefaults,
  vodPlaybackUrls,
  type IngestProtocol,
  type PlaybackFormat,
} from "../../data/media";

/**
 * Room Detail → Connections Information — matches media-cloudplus's
 * ConnectionInfo exactly (structure, copy, spacing, and the same shadcn
 * semantic tokens dashboard-ui already carries), just repointed at this
 * app's own data/hook modules.
 *
 * The three sections read in the order the work happens — send the stream,
 * watch it live, then watch the recording — rather than grouping by URL type.
 * Each one answers the same three questions in the same order: what is this
 * for, which flavour do you want, and what do I paste where.
 */
export function RoomConnectionsTab({ vodEnabled }: { vodEnabled: boolean }) {
  const [playback, setPlayback] = useState<PlaybackFormat>("HLS");
  const [vodFormat, setVodFormat] = useState<PlaybackFormat>("HLS");
  const [ingest, setIngest] = useState<IngestProtocol>("RTMPS");

  const playbackSigning = useSigningState(signingDefaults.playbackSigned, signingDefaults.expirationMinutes);
  // Broadcasting has no expiration: an ingest URL that dies mid-stream would
  // drop the encoder, so the publish signature is valid for as long as it is
  // the current one. 0 minutes = never expires.
  const publishSigning = useSigningState(signingDefaults.publishSigned, 0);

  const playbackEndpoint = useSignedEndpoint(playbackUrls[playback], playbackSigning.state);
  const publishEndpoint = useSignedEndpoint(publishUrls[ingest], publishSigning.state);

  return (
    <Card className="flex max-w-[860px] flex-col gap-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold">Connection information</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything you need to send this room a stream and play it back.
          </p>
        </div>
        <Button variant="outline">Docs</Button>
      </div>

      <EndpointSection
        title="Send your stream here"
        description="Paste this into OBS, vMix, or whatever encoder you broadcast with."
      >
        <ProtocolChips
          label="Ingest protocol"
          options={ingestProtocols}
          value={ingest}
          onChange={(v) => setIngest(v as IngestProtocol)}
        />
        <CopyField id="publish-url" label="Ingest endpoint" value={publishEndpoint.signedUrl} />
        <SignedUrlSetting
          idPrefix="publish"
          title="Require a signed publish URL"
          description="Only encoders holding the secret can broadcast to this room."
          signing={publishSigning}
          showExpiry={false}
        />
      </EndpointSection>

      <Separator />

      <EndpointSection
        title="Watch it live"
        description="Give this URL to your web or mobile player while the stream is running."
      >
        <ProtocolChips
          label="Delivery format"
          options={playbackFormats}
          value={playback}
          onChange={(v) => setPlayback(v as PlaybackFormat)}
        />
        <CopyField
          id="playback-url"
          label="Playback URL"
          value={playbackEndpoint.signedUrl}
          error={playbackEndpoint.expired ? EXPIRED_NOTE : undefined}
          action={
            // A signed link can be valid for hours, so there is otherwise no
            // way to look at the expired state while designing or reviewing.
            playbackEndpoint.isSigned && !playbackEndpoint.expired ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-1.5 py-0.5 text-xs text-muted-foreground"
                onClick={playbackEndpoint.expireNow}
              >
                <TriangleAlert className="size-3.5" />
                Preview expired
              </Button>
            ) : undefined
          }
        />
        <SignedUrlSetting
          idPrefix="playback"
          title="Require a signed playback URL"
          description="Only viewers with a valid, unexpired signature can watch."
          signing={playbackSigning}
        />
      </EndpointSection>

      {vodEnabled && (
        <>
          <Separator />
          <EndpointSection
            title="Watch the recording"
            description="Available as video-on-demand once the live stream ends."
          >
            <ProtocolChips
              label="VOD delivery format"
              options={playbackFormats}
              value={vodFormat}
              onChange={(v) => setVodFormat(v as PlaybackFormat)}
            />
            <CopyField id="vod-url" label="Recording URL" value={vodPlaybackUrls[vodFormat]} />
          </EndpointSection>
        </>
      )}
    </Card>
  );
}

/** Shown only once the signed link is actually dead; Generate clears it. */
const EXPIRED_NOTE = "This link has expired. Generate a new secret below to issue a fresh one.";

/**
 * One stage of the connection flow. Order and the separators between sections
 * carry the sequence — the headings stay plain so the card reads calmly even
 * when both signing panels are open.
 */
function EndpointSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4">
      <div>
        <h3 className="text-sm font-bold">{title}</h3>
        <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function ProtocolChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const uid = useId();

  return (
    <div className="grid gap-2">
      <span id={uid} className="text-sm font-medium">
        {label}
      </span>
      {/* Same pill tray as the design system's tab strip, so a protocol switch
          and a tab switch look like the same control. */}
      <div
        role="group"
        aria-labelledby={uid}
        className="inline-flex w-fit max-w-full flex-wrap items-center gap-0 rounded-lg bg-muted p-1"
      >
        {options.map((option) => {
          const Icon = protocolIcons[option as PlaybackFormat | IngestProtocol];
          return (
            <button
              key={option}
              type="button"
              aria-pressed={value === option}
              onClick={() => onChange(option)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm outline-hidden transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                value === option
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden />
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Signing = ReturnType<typeof useSigningState>;

/**
 * "Require a signed …" row. Enabling it reveals the secret and expiry the
 * signature is built from — and every Generate re-signs the endpoint above,
 * so the URL always matches the credential currently on screen.
 */
function SignedUrlSetting({
  idPrefix,
  title,
  description,
  signing,
  showExpiry = true,
}: {
  idPrefix: string;
  title: string;
  description: string;
  signing: Signing;
  /** Broadcasting signatures don't expire, so that field is hidden there. */
  showExpiry?: boolean;
}) {
  const uid = useId();
  const [revealed, setRevealed] = useState(false);
  const { state, update, regenerate, reset, dirty, setDirty } = signing;
  const tooShort = state.secret.length > 0 && state.secret.length < 16;
  // Signing is switched on but nothing is signing yet — say so, rather than
  // leaving an unsigned URL sitting above a switch that reads "on".
  const awaitingSecret = state.enabled && state.secret.length < 16;

  function handleReset() {
    reset();
    setRevealed(false);
  }

  return (
    <div className="rounded-lg border">
      <div className="flex items-start gap-4 p-4">
        <div className="min-w-0 flex-1">
          <Label htmlFor={`${uid}-toggle`} className="text-sm font-medium">
            {title}
          </Label>
          <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
        </div>
        <Switch id={`${uid}-toggle`} checked={state.enabled} onCheckedChange={(next) => update({ enabled: next })} />
      </div>

      {state.enabled && (
        <div className="grid gap-4 border-t p-4">
          {awaitingSecret && (
            <p className="text-[13px] text-muted-foreground">
              The URL above is still unsigned. Generate a secret to sign it.
            </p>
          )}

          <div className="grid gap-2">
            <Label htmlFor={`${uid}-secret`}>Secret</Label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Input
                  id={`${uid}-secret`}
                  name={`${idPrefix}-secret`}
                  type={revealed ? "text" : "password"}
                  value={state.secret}
                  placeholder="At least 16 characters"
                  aria-invalid={tooShort}
                  aria-describedby={`${uid}-secret-help`}
                  onChange={(e) => update({ secret: e.target.value })}
                  className="pr-10 font-mono text-[13px] md:text-[13px]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={revealed ? "Hide secret" : "Show secret"}
                  onClick={() => setRevealed((v) => !v)}
                  className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
                >
                  {revealed ? (
                    <EyeOff className="size-4 text-muted-foreground" />
                  ) : (
                    <Eye className="size-4 text-muted-foreground" />
                  )}
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  regenerate();
                  setRevealed(true);
                }}
              >
                <WandSparkles className="size-4" />
                Generate
              </Button>
            </div>
            <p
              id={`${uid}-secret-help`}
              className={cn("text-[13px]", tooShort ? "text-destructive" : "text-muted-foreground")}
            >
              At least 16 characters. Copy it now — it won&apos;t be shown again.
            </p>
          </div>

          {showExpiry && (
            <div className="grid gap-2">
              <Label htmlFor={`${uid}-expiry`}>Expiration (minutes)</Label>
              <Input
                id={`${uid}-expiry`}
                type="number"
                min={0}
                inputMode="numeric"
                value={state.expirationMinutes}
                aria-describedby={`${uid}-expiry-help`}
                onChange={(e) => update({ expirationMinutes: e.target.value })}
                className="w-full max-w-[180px]"
              />
              <p id={`${uid}-expiry-help`} className="text-[13px] text-muted-foreground">
                0 minutes means the signed URL never expires.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!dirty || tooShort}
              onClick={() => setDirty(false)}
            >
              Save changes
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export type { SigningState };
