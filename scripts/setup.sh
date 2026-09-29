#!/bin/sh
set -eu

repo_url="${SOULSTACK_REPO:-https://github.com/proxysoul/SoulStack.git}"
home_dir="${SOULSTACK_DIR:-$HOME/dev/SoulStack}"
skills_target="$HOME/.agents/skills"
config="$HOME/.empryo/config.json"
presets=""
mode=install
plain=0
stamp=$(date +%Y%m%d-%H%M%S)

usage() {
  cat <<'EOF'
usage: soulstack [update|check|remove] [options]
       setup.sh [update|check|remove] [options]

Installs or updates SoulStack for every agent it finds. Asks nothing; backs up every file before changing it.

  update           the default: get the latest SoulStack and set it up again
  check            change nothing; show what is installed and whether an update is out
  remove           take SoulStack out again (skill links, the rules block, the soulstack command)
  --check          change nothing; show what is installed
  --remove         take SoulStack out again (skill links and the rules block)
  --presets a,b    also add Empryo presets, e.g. proxysoul,proxysoul-mcp
  --skills DIR     link the skills here instead of ~/.agents/skills
  --plain          no colour, no animation (automatic when not in a terminal)

SOULSTACK_DIR sets where SoulStack is kept (default ~/dev/SoulStack), SOULSTACK_REPO the source.
EOF
}

args=""
for a in "$@"; do args="$args '$(printf '%s' "$a" | sed "s/'/'\\\\''/g")'"; done

while [ $# -gt 0 ]; do
  case "$1" in
    update|install) mode=install; shift ;;
    check) mode=check; shift ;;
    remove) mode=remove; shift ;;
    --check) mode=check; shift ;;
    --remove) mode=remove; shift ;;
    --presets) presets="$2"; shift 2 ;;
    --skills) skills_target="$2"; shift 2 ;;
    --config) config="$2"; shift 2 ;;
    --plain) plain=1; shift ;;
    --yes|-y) shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [ ! -t 1 ] || [ -n "${NO_COLOR:-}" ] || [ "${TERM:-dumb}" = dumb ]; then plain=1; fi

c_fg=""; c_dim=""; c_acc=""; c_eye=""; c_ok=""; c_warn=""; c_bold=""; c_off=""
if [ "$plain" -eq 0 ]; then
  esc=$(printf '\033')
  case "${COLORTERM:-}" in
    truecolor|24bit)
      c_fg="$esc[38;2;232;235;238m"; c_dim="$esc[38;2;110;120;133m"; c_acc="$esc[38;2;152;176;194m"
      c_eye="$esc[38;2;224;169;182m"; c_ok="$esc[38;2;147;179;162m"; c_warn="$esc[38;2;207;181;149m" ;;
    *)
      c_fg="$esc[97m"; c_dim="$esc[90m"; c_acc="$esc[36m"; c_eye="$esc[35m"; c_ok="$esc[32m"; c_warn="$esc[33m" ;;
  esac
  c_bold="$esc[1m"; c_off="$esc[0m"
fi

work=$(mktemp -d)
results="$work/results"
: > "$results"
cleanup() {
  rm -rf "$work"
  if [ "$plain" -eq 0 ]; then printf '\033[?25h'; fi
}
trap cleanup EXIT
trap 'exit 130' INT TERM

tilde() {
  case "$1" in
    "$HOME"/*) printf '~%s' "${1#"$HOME"}" ;;
    *) printf '%s' "$1" ;;
  esac
}

record() {
  printf '%s|%s|%s|%s\n' "$1" "$2" "$3" "$4" >> "$results"
  if [ "$plain" -eq 1 ]; then
    if [ -n "$2" ]; then
      printf '  %-7s %-8s %-14s %s\n' "$1" "$2" "$3" "$4"
    else
      printf '  %-7s %s\n' "$1" "$3"
    fi
  fi
}

backup() {
  if [ -f "$1" ]; then
    b="$1.bak-$stamp"
    i=1
    while [ -e "$b" ]; do b="$1.bak-$stamp-$i"; i=$((i + 1)); done
    cp "$1" "$b"
    printf '%s' " (backed up)"
  fi
}

self=$0
while [ -L "$self" ]; do
  link=$(readlink "$self")
  case "$link" in /*) self=$link ;; *) self=$(dirname "$self")/$link ;; esac
done
script_dir=$(cd "$(dirname "$self")" 2>/dev/null && pwd || echo "")
root=""
if [ -n "$script_dir" ] && [ -d "$script_dir/../skills" ] && [ -f "$script_dir/../AGENTS.md" ]; then
  root=$(cd "$script_dir/.." && pwd)
fi

version_at() {
  git -C "$1" show "$2:plugin.json" 2>/dev/null | sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' | head -1
}

stack_word=""
stack_note=""
news="$work/news"
: > "$news"
sync_stack() {
  dir=${root:-$home_dir}
  if ! command -v git >/dev/null 2>&1; then
    if [ -n "$root" ]; then return 0; fi
    echo "git is needed to download SoulStack." >&2
    exit 1
  fi
  if [ ! -d "$dir/.git" ]; then
    if [ -n "$root" ]; then return 0; fi
    if [ "$mode" != install ]; then echo "SoulStack is not installed. Set it up with: curl -fsSL https://raw.githubusercontent.com/proxysoul/SoulStack/main/scripts/setup.sh | sh"; exit 0; fi
    mkdir -p "$(dirname "$dir")"
    git clone --quiet "$repo_url" "$dir"
    root=$dir
    stack_word=created
    stack_note="v$(version_at "$dir" HEAD)"
    return 0
  fi
  root=$dir
  now=$(git -C "$dir" rev-parse HEAD)
  if [ -n "${SOULSTACK_FROM:-}" ]; then
    from=$SOULSTACK_FROM
  else
    if ! git -C "$dir" fetch --quiet 2>/dev/null; then stack_word=offline; stack_note="could not reach GitHub, kept v$(version_at "$dir" HEAD)"; return 0; fi
    up=$(git -C "$dir" rev-parse -q --verify '@{u}' 2>/dev/null || true)
    if [ -z "$up" ] || [ "$up" = "$now" ]; then stack_word=same; stack_note="v$(version_at "$dir" HEAD), the latest"; return 0; fi
    if [ "$mode" != install ]; then
      stack_word=outdated
      stack_note="v$(version_at "$dir" "$up") is out, run: soulstack update"
      return 0
    fi
    if git -C "$dir" merge-base --is-ancestor HEAD "$up"; then
      if ! git -C "$dir" merge --ff-only --quiet "$up" 2>/dev/null; then stack_word=skipped; stack_note="your local changes clash with the update"; return 0; fi
    elif [ -z "$(git -C "$dir" status --porcelain)" ]; then
      git -C "$dir" branch -f "backup-$stamp" HEAD
      git -C "$dir" reset --hard --quiet "$up"
    else
      stack_word=skipped
      stack_note="you have local changes, so it was not updated"
      return 0
    fi
    from=$now
    case "$script_dir" in
      "$dir"/scripts)
        eval "exec env SOULSTACK_FROM=$from sh \"$dir/scripts/setup.sh\" $args"
        ;;
    esac
  fi
  if [ "$from" = "$(git -C "$dir" rev-parse HEAD)" ]; then stack_word=same; stack_note="v$(version_at "$dir" HEAD), the latest"; return 0; fi
  stack_word=updated
  v_old=$(version_at "$dir" "$from")
  v_new=$(version_at "$dir" HEAD)
  if [ "$v_old" = "$v_new" ]; then stack_note="v$v_new, latest changes"; else stack_note="v$v_old to v$v_new"; fi
  git -C "$dir" log --no-merges --format='%s' "$from..HEAD" 2>/dev/null | head -5 > "$news"
}

phase_stack() {
  record stack "$stack_word" "$(tilde "$root")" "$stack_note"
  while IFS= read -r line; do record new "" "$line" ""; done < "$news"
}

has_empryo=0
has_claude=0
has_codex=0
has_copilot=0
has_pi=0
has_opencode=0
has_gemini=0
claude_home="$HOME/.claude"
case "${CLAUDE_CONFIG_DIR:-}" in /*) claude_home=$CLAUDE_CONFIG_DIR ;; esac
codex_home="${CODEX_HOME:-$HOME/.codex}"
copilot_home="${COPILOT_HOME:-$HOME/.copilot}"
pi_home="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"
opencode_home="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
gemini_home="${GEMINI_CLI_HOME:-$HOME}/.gemini"

has_any() {
  dir=$1
  shift
  for m in "$@"; do
    if [ -e "$dir/$m" ]; then return 0; fi
  done
  return 1
}

pi_cli() {
  p=$(command -v pi 2>/dev/null) || return 1
  { ls -l "$p"; head -c 2048 "$p"; } 2>/dev/null | grep -q 'coding-agent\|earendil'
}

phase_detect() {
  if command -v empryo >/dev/null 2>&1 || [ -f "$HOME/.empryo/config.json" ] || [ -x "$HOME/.empryo/bin/empryo" ] || [ -d "/Applications/Empryo.app" ] || [ -d "$HOME/Applications/Empryo.app" ]; then has_empryo=1; fi
  if command -v claude >/dev/null 2>&1 || has_any "$claude_home" settings.json CLAUDE.md projects .credentials.json; then has_claude=1; fi
  if command -v codex >/dev/null 2>&1 || has_any "$codex_home" config.toml auth.json AGENTS.md sessions; then has_codex=1; fi
  if command -v copilot >/dev/null 2>&1 || has_any "$copilot_home" config.json copilot-instructions.md session-state agents; then has_copilot=1; fi
  if pi_cli || [ -d "$pi_home" ]; then has_pi=1; fi
  if command -v opencode >/dev/null 2>&1 || has_any "$opencode_home" opencode.json opencode.jsonc AGENTS.md agents agent; then has_opencode=1; fi
  if command -v gemini >/dev/null 2>&1 || has_any "$gemini_home" settings.json GEMINI.md oauth_creds.json; then has_gemini=1; fi
  found=""
  [ "$has_empryo" -eq 1 ] && found="Empryo"
  [ "$has_claude" -eq 1 ] && found="${found:+$found, }Claude Code"
  [ "$has_codex" -eq 1 ] && found="${found:+$found, }Codex"
  [ "$has_copilot" -eq 1 ] && found="${found:+$found, }Copilot"
  [ "$has_pi" -eq 1 ] && found="${found:+$found, }pi"
  [ "$has_opencode" -eq 1 ] && found="${found:+$found, }OpenCode"
  [ "$has_gemini" -eq 1 ] && found="${found:+$found, }Gemini CLI"
  record found "" "${found:-no agents yet}" ""
  if [ "$has_empryo" -eq 0 ]; then record "" "" "no Empryo: skipping Empryo parts (https://empryo.com)" ""; fi
  return 0
}

link_skills() {
  target=$1
  for d in "$root"/skills/*/; do
    n=$(basename "$d")
    src="$root/skills/$n"
    dest="$target/$n"
    if [ "$mode" = remove ]; then
      if [ -L "$dest" ] && [ "$(readlink "$dest")" = "$src" ]; then rm "$dest"; record skill removed "$n" "$(tilde "$dest")"; fi
      continue
    fi
    if [ -L "$dest" ] && [ "$(readlink "$dest")" = "$src" ]; then
      record skill same "$n" "$(tilde "$dest")"
    elif [ "$mode" = check ]; then
      record skill missing "$n" "$(tilde "$dest")"
    elif [ -e "$dest" ] && [ ! -L "$dest" ]; then
      record skill skipped "$n" "$(tilde "$dest") is not ours"
    else
      mkdir -p "$target"
      ln -sfn "$src" "$dest"
      record skill linked "$n" "$(tilde "$dest")"
    fi
  done
}

phase_command() {
  bin="$HOME/.local/bin"
  cmd="$bin/soulstack"
  src="$root/scripts/setup.sh"
  if [ "$mode" = remove ]; then
    if [ -L "$cmd" ] && [ "$(readlink "$cmd")" = "$src" ]; then rm "$cmd"; record command removed soulstack "$(tilde "$cmd")"; fi
    return 0
  fi
  case ":$PATH:" in
    *":$bin:"*) ;;
    *) record command skipped soulstack "$(tilde "$bin") is not on your PATH"; return 0 ;;
  esac
  if [ -L "$cmd" ] && [ "$(readlink "$cmd")" = "$src" ]; then
    record command same soulstack "$(tilde "$cmd")"
  elif [ "$mode" = check ]; then
    record command missing soulstack "$(tilde "$cmd")"
  elif [ -e "$cmd" ] && [ ! -L "$cmd" ]; then
    record command skipped soulstack "$(tilde "$cmd") is not ours"
  else
    mkdir -p "$bin"
    ln -sfn "$src" "$cmd"
    record command linked soulstack "$(tilde "$cmd")"
  fi
}

link_agents() {
  target=$1
  label=$2
  suffix=$3
  total=0
  changed=0
  missing=0
  foreign=0
  for f in "$root"/agents/*.md; do
    [ -f "$f" ] || continue
    n=$(basename "$f" .md)
    dest="$target/$n$suffix"
    total=$((total + 1))
    if [ "$mode" = remove ]; then
      if [ -L "$dest" ] && [ "$(readlink "$dest")" = "$f" ]; then rm "$dest"; changed=$((changed + 1)); fi
      continue
    fi
    if [ -L "$dest" ] && [ "$(readlink "$dest")" = "$f" ]; then continue; fi
    if [ -e "$dest" ] && [ ! -L "$dest" ]; then foreign=$((foreign + 1)); continue; fi
    if [ "$mode" = check ]; then missing=$((missing + 1)); continue; fi
    mkdir -p "$target"
    ln -sfn "$f" "$dest"
    changed=$((changed + 1))
  done
  [ "$total" -gt 0 ] || return 0
  where="$(tilde "$target") ($total)"
  if [ "$foreign" -gt 0 ]; then where="$where, $foreign kept as yours"; fi
  if [ "$mode" = remove ]; then
    if [ "$changed" -gt 0 ]; then record agent removed "$label" "$where"; fi
  elif [ "$missing" -gt 0 ]; then
    record agent missing "$label" "$where"
  elif [ "$changed" -gt 0 ]; then
    record agent linked "$label" "$where"
  else
    record agent same "$label" "$where"
  fi
}

phase_agents() {
  if [ "$has_empryo" -eq 1 ]; then link_agents "$HOME/.agents/agents" "Empryo" ".md"; fi
  if [ "$has_claude" -eq 1 ]; then link_agents "$claude_home/agents" "Claude Code" ".md"; fi
  if [ "$has_copilot" -eq 1 ]; then link_agents "$copilot_home/agents" "Copilot" ".agent.md"; fi
  if [ "$has_opencode" -eq 1 ]; then
    link_agents "$opencode_home/agents" "OpenCode" ".md"
    if [ -d "$opencode_home/agent" ]; then link_agents "$opencode_home/agent" "OpenCode" ".md"; fi
  fi
  return 0
}

phase_skills() {
  link_skills "$skills_target"
  if [ "$has_claude" -eq 1 ] && [ "$skills_target" != "$claude_home/skills" ]; then link_skills "$claude_home/skills"; fi
}

block_file="$work/block"
write_rules() {
  file=$1
  label=$2
  if [ "$mode" = remove ]; then
    if [ -f "$file" ] && grep -q '^<!-- soulstack:start -->$' "$file"; then
      note=$(backup "$file")
      awk '/^<!-- soulstack:start -->$/{skip=1; next} /^<!-- soulstack:end -->$/{skip=0; next} !skip' "$file" > "$work/tmp"
      cat "$work/tmp" > "$file"
      record rules removed "$label" "$(tilde "$file")$note"
    fi
    return
  fi
  if [ -f "$file" ] && grep -q '^<!-- soulstack:start -->$' "$file"; then
    current=$(awk '/^<!-- soulstack:start -->$/{on=1} on{print} /^<!-- soulstack:end -->$/{on=0}' "$file")
    if [ "$current" = "$(cat "$block_file")" ]; then record rules same "$label" "$(tilde "$file")"; return; fi
    if [ "$mode" = check ]; then record rules outdated "$label" "$(tilde "$file")"; return; fi
    note=$(backup "$file")
    {
      awk '/^<!-- soulstack:start -->$/{exit} {print}' "$file"
      cat "$block_file"
      awk 'f{print} /^<!-- soulstack:end -->$/{f=1}' "$file"
    } > "$work/tmp"
    cat "$work/tmp" > "$file"
    record rules updated "$label" "$(tilde "$file")$note"
    return
  fi
  if [ "$mode" = check ]; then record rules missing "$label" "$(tilde "$file")"; return; fi
  mkdir -p "$(dirname "$file")"
  if [ -f "$file" ]; then
    note=$(backup "$file")
    { printf '\n'; cat "$block_file"; } >> "$file"
    record rules added "$label" "$(tilde "$file")$note"
  else
    cp "$block_file" "$file"
    record rules created "$label" "$(tilde "$file")"
  fi
}

write_agents_md() {
  write_rules "$1/AGENTS.md" "$2"
  if [ "$mode" != remove ] && [ -f "$1/AGENTS.override.md" ]; then
    record rules hidden "$2" "$(tilde "$1/AGENTS.override.md") is read instead of AGENTS.md"
  fi
}

phase_rules() {
  {
    echo "<!-- soulstack:start -->"
    cat "$root/guides/takeaways.md"
    echo "<!-- soulstack:end -->"
  } > "$block_file"
  if [ "$has_empryo" -eq 1 ]; then write_rules "$HOME/.empryo/EMPRYO.md" "Empryo"; fi
  if [ "$has_claude" -eq 1 ]; then write_rules "$claude_home/CLAUDE.md" "Claude Code"; fi
  if [ "$has_codex" -eq 1 ]; then write_agents_md "$codex_home" "Codex"; fi
  if [ "$has_copilot" -eq 1 ]; then write_rules "$copilot_home/copilot-instructions.md" "Copilot"; fi
  if [ "$has_pi" -eq 1 ]; then write_agents_md "$pi_home" "pi"; fi
  if [ "$has_opencode" -eq 1 ]; then write_rules "$opencode_home/AGENTS.md" "OpenCode"; fi
  if [ "$has_gemini" -eq 1 ]; then write_rules "$gemini_home/GEMINI.md" "Gemini CLI"; fi
  return 0
}

json_runner() {
  for r in bun node python3; do
    if command -v "$r" >/dev/null 2>&1; then echo "$r"; return; fi
  done
  echo none
}

phase_presets() {
  if [ -z "$presets" ] || [ "$mode" != install ]; then return 0; fi
  if [ "$has_empryo" -eq 0 ]; then record preset skipped "$presets" "Empryo not found"; return 0; fi
  specs=""
  old_ifs=$IFS
  IFS=,
  for p in $presets; do
    IFS=$old_ifs
    f="$root/plugins/presets/$p.json"
    [ -f "$f" ] || { echo "unknown preset: $p" >&2; exit 2; }
    specs="$specs $f"
  done
  IFS=$old_ifs
  runner=$(json_runner)
  if [ "$runner" = none ]; then record preset skipped "$presets" "needs bun, node or python3"; return 0; fi
  mkdir -p "$(dirname "$config")"
  case "$runner" in
    bun|node) "$runner" -e '
      const fs = require("fs");
      const os = require("os");
      const path = require("path");
      const [file, out, ...specs] = process.argv.slice(1);
      const cfg = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
      const real = (s) => {
        const p = path.resolve(path.dirname(file), s.replace(/^~(?=$|[\\/])/, os.homedir()));
        try { return fs.realpathSync(p); } catch { return p; }
      };
      const list = Array.isArray(cfg.presets) ? cfg.presets.filter((s) => typeof s === "string") : [];
      const have = new Set(list.map(real));
      for (const s of specs) {
        if (have.has(real(s))) { console.log("same " + s); continue; }
        list.push(s);
        have.add(real(s));
        console.log("added " + s);
      }
      cfg.presets = list;
      fs.writeFileSync(out, JSON.stringify(cfg, null, 2) + "\n");
    ' "$config" "$work/config" $specs > "$work/presets" ;;
    python3) python3 - "$config" "$work/config" $specs > "$work/presets" <<'EOF'
import json, os, sys
file, out, specs = sys.argv[1], sys.argv[2], sys.argv[3:]
cfg = json.load(open(file)) if os.path.exists(file) else {}
real = lambda s: os.path.realpath(os.path.join(os.path.dirname(os.path.abspath(file)), os.path.expanduser(s)))
cur = [s for s in cfg.get("presets", []) if isinstance(s, str)]
have = set(map(real, cur))
for s in specs:
    if real(s) in have:
        print("same " + s)
        continue
    cur.append(s)
    have.add(real(s))
    print("added " + s)
cfg["presets"] = cur
open(out, "w").write(json.dumps(cfg, indent=2) + "\n")
EOF
    ;;
  esac
  note=""
  if grep -q '^added ' "$work/presets"; then
    note=$(backup "$config")
    cat "$work/config" > "$config"
  fi
  while read -r word f; do
    if [ "$word" = added ]; then
      record preset added "$(basename "$f" .json)" "$(tilde "$config")$note"
      note=""
    else
      record preset same "$(basename "$f" .json)" "$(tilde "$config")"
    fi
  done < "$work/presets"
}

paint() {
  case "$1" in
    added|linked|created) printf '%s' "$c_ok" ;;
    updated|copied|removed) printf '%s' "$c_acc" ;;
    missing|skipped|outdated|offline|hidden) printf '%s' "$c_warn" ;;
    *) printf '%s' "$c_dim" ;;
  esac
}

frames_file="$work/frames"
cat > "$frames_file" <<'FRAMES'
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
       {⢠⡾⠛⢿⡆}    
       {⠈⠿⣶⠾⠃}    
                
                
                
                
    ⢀⠔⠚⠉⠙⣒⡦     
   ⢠⠁  {⢠⣿⠻⢿⣎}⡄   
   ⢠   {⠘⠿⣶⡿⠃}⡆   
   ⠘⣆      ⣠⠃   
    ⠈⠓⠦⠤⠶⠒⠊⠁    
                
                
    ⣠⠖⠛⠛⠛⣛⡶⣄    
   ⣼⠁  {⢰⣿⠻⣿⣯}⣧   
   ⣿   {⠘⢿⣶⡿⠋}⣿   
   ⠸⣧      ⣰⠏   
    ⠈⠻⠶⠶⢶⠶⠛⠉    
                
                
    ⣠⠶⠛⠛⢛⣛⡶⣄    
   ⣼⠁  {⢰⣿⠻⣿⣯}⣷   
   ⣿   {⠘⢿⣶⡿⠏}⣿   
   ⠹⣧      ⣰⡏   
    ⠙⠻⠶⠶⢶⠶⠟⠋    
                
     ⡄ ⢀⡄  ⡀    
   ⢢⣴⠞⠛⠛⢛⣛⡾⣦⡀   
   ⣾⠁  {⢰⣿⠻⣿⣿}⣿⠁  
  ⠘⣿   {⠘⢿⣶⡿⠏}⣿⠂  
   ⢽⣧⡀     ⣰⡟   
    ⠙⢿⢶⡶⢶⠶⠟⠋⠂   
     ⠁  ⠈       
     ⣄⢀⣀⣆  ⡀    
   ⢢⣴⠟⠛⠛⢛⣻⣿⣦⡀   
  ⢀⣿⠁  {⢰⣿⠻⢿⣯}⣿⠉  
 ⠈⠙⣿   {⠘⢿⣶⡿⠏}⣿⠓⠄ 
  ⢠⢿⣧      ⣰⡟   
    ⠙⢿⣶⣶⢶⠶⠟⠋⠂   
     ⠁  ⠘       
     ⣄⣀⣀⣆ ⢀⡀    
   ⢲⣴⠟⠛⠛⢛⣻⣿⣦⣄   
  ⢀⣿⠁  {⢰⣿⠻⢿⣯}⣿⠉  
 ⠈⠛⣿   {⠘⢿⣶⡿⠏}⣿⠳⠄ 
  ⢠⢿⣇      ⣰⡟   
    ⠙⣷⣶⣶⢶⠶⠟⠋⠂   
     ⠁  ⠘       
     ⣄⣀⣠⣆⡀⢀⡀    
   ⢲⣴⠟⠛⠛⢛⣻⣿⣶⣄   
  ⢀⣿⠁  {⢰⣿⠻⢿⣯}⣿⡉  
 ⠈⠛⣿   {⠘⢿⣶⡿⠏}⣿⠳⠄ 
  ⢠⢿⣇      ⣰⡟   
    ⠙⣿⣶⣶⢶⠶⠟⠋⠂   
     ⠁  ⠘       
     ⣄⣀⣠⣆⡀⢀⡀    
   ⢲⣴⠟⠛⠛⢛⣻⣿⣶⣄   
  ⢀⣿⠁  {⢰⣿⠻⢿⣯}⣿⡉  
 ⠈⠛⣿   {⠘⢿⣶⡿⠏}⣿⠳⠄ 
  ⢠⢿⣇      ⣰⡟   
    ⠙⣿⣶⣶⢶⠶⠟⠋⠂   
     ⠁  ⠘       
     ⣄⣀⣠⣆ ⢀⡀    
   ⢲⣴⠟⠛⠛⢛⣻⣿⣶⣄   
  ⢀⣿⠁  {⢰⣿⠻⢿⣯}⣿⡉  
 ⠈⠛⣿   {⠘⢿⣶⡿⠏}⣿⠳⠄ 
  ⢠⢿⣇      ⣰⡟   
    ⠙⣷⣶⣶⢶⠶⠟⠋⠂   
     ⠁  ⠘       
     ⣄⢀⣀⣆ ⢀⡀    
   ⢲⣴⠟⠛⠛⢛⣻⣿⣦⡄   
  ⢀⣿⠁  {⢰⣿⠻⢿⣯}⣿⡉  
 ⠈⠻⣿   {⠘⢿⣶⡿⠏}⣿⠳⠄ 
  ⢠⢿⣇      ⣰⡟   
    ⠙⣷⣶⣶⢶⠶⠟⠋⠂   
     ⠁  ⠘       
     ⣄⢀⣀⣆ ⢀⡀    
   ⢲⣴⠟⠛⠛⢛⣛⡿⣦⡀   
  ⢀⣿⠁  {⢰⣿⠻⢿⣯}⣿⡉  
 ⠈⠻⣿   {⠘⢿⣶⡿⠏}⣿⠳⠄ 
  ⢠⢽⣇      ⣠⡟   
    ⠙⢷⣶⣴⢶⠶⠞⠋⠆   
     ⠁  ⠘       
     ⣄⢀⣀⣆ ⢀⡀    
   ⢲⣴⠿⠛⠛⢛⣻⣿⣦⡀   
  ⢀⣿⠁  {⢰⣿⠻⢿⣯}⣿⡉  
 ⠈⠻⣿   {⠘⢿⣶⣿⠏}⣿⠷⠄ 
  ⢠⢿⣇      ⣠⡟   
    ⠙⢷⣦⣴⣶⡶⠾⠛⠆   
     ⠉  ⠘       
     ⣄⢀⣀⡆ ⢀⡀    
   ⢲⣴⠿⠛⠛⢛⣻⣿⣦⡀   
  ⢀⣾⠁  {⢰⣿⠿⣿⣯}⣿⠉  
 ⠈⠻⣿   {⠘⢿⣶⣾⠏}⣿⠷⠄ 
  ⢀⣿⣇      ⣠⡟   
    ⠙⢷⣦⣴⣶⡶⠾⠛⠆   
     ⠉  ⠘       
     ⣄⢀⣀⣆ ⢀⡀    
   ⢲⣴⠟⠛⠛⢛⣛⡿⣦⡄   
  ⢀⣿⠁  ⢰⢫⢠⢌⢫⣿⡉  
 ⠈⠻⣿   ⠘⢮⣁⡡⠏⣿⠳⠄ 
  ⢠⢿⣇      ⣰⡟   
    ⠙⢷⣶⣴⢶⠶⠟⠋⠂   
     ⠁  ⠘       
     ⣄⣀⣠⣆⡀⢀⡀    
   ⢲⣴⠟⠛⠛⢛⣻⡿⣶⣄   
  ⢀⣿⠁  ⢰⢁⢠⢌⢫⣿⡉  
 ⠈⠛⣿   ⠘⢄⣁⡡⠎⣿⠳⠄ 
  ⢠⢿⣇      ⣰⡟   
    ⠙⣿⣶⣶⢶⠶⠟⠋⠂   
     ⠁  ⠘       
     ⣄⢀⣀⣆ ⢀⡀    
   ⢲⣴⠟⠛⠛⢛⣛⡿⣦⣄   
  ⢀⣿⠁  ⢰⢁⢠⢌⢫⣿⡉  
 ⠈⠻⣿   ⠘⢄⣁⡡⠎⣿⠳⠄ 
  ⢠⢿⣇      ⣰⡟   
    ⠙⣷⣶⣶⢶⠶⠟⠋⠂   
     ⠁  ⠘       
     ⣄⢀⣀⣆ ⢀⡀    
   ⢲⣴⠟⠛⠛⢛⣛⡿⣦⡀   
  ⢀⣿⠁  {⢰⣿⠻⢿⣯}⣿⡉  
 ⠈⠻⣿   {⠘⢿⣶⡿⠏}⣿⠳⠄ 
  ⢠⢽⣇      ⣠⡟   
    ⠙⢷⣶⣴⢶⠶⠞⠋⠆   
     ⠁  ⠘       
FRAMES

bar() {
  done_n=$1
  total=$2
  width=22
  fill=$((done_n * width / total))
  pct=$((done_n * 100 / total))
  i=0
  out="$c_acc"
  while [ $i -lt $fill ]; do out="${out}━"; i=$((i + 1)); done
  out="${out}${c_dim}"
  while [ $i -lt $width ]; do out="${out}─"; i=$((i + 1)); done
  printf '%s%s %3s%%%s' "$out" "$c_off" "$pct" ""
}

draw() {
  frame=$1
  step=$2
  label=$3
  s=$(( (frame - 1) * 7 + 1 ))
  e=$(( s + 6 ))
  sed -n "${s},${e}p" "$frames_file" | sed "s/{/$c_eye/g; s/}/$c_acc/g" > "$work/f"
  r=0
  while IFS= read -r line; do
    r=$((r + 1))
    case $r in
      2) right="$c_bold${c_fg}SoulStack$c_off" ;;
      3) right="${c_dim}Empryo × ProxySoul$c_off" ;;
      5) right=$(bar "$step" 20) ;;
      6) right="$c_dim$label$c_off" ;;
      *) right="" ;;
    esac
    printf '\033[2K  %s%s%s    %s\n' "$c_acc" "$line" "$c_off" "$right"
  done < "$work/f"
}

summary() {
  awk -F'|' -v dim="$c_dim" -v off="$c_off" -v fg="$c_fg" -v ok="$c_ok" -v acc="$c_acc" -v warn="$c_warn" '
    function color(s) { return (s ~ /^(added|linked|created)$/) ? ok : (s ~ /^(updated|copied|removed)$/) ? acc : (s ~ /^(missing|skipped|outdated|offline|hidden)$/) ? warn : dim }
    $1 == "stack" || $1 == "found" || $1 == "new" || $1 == "" { next }
    {
      if (!($1 in seen)) { order[++n] = $1; seen[$1] = 1 }
      k = $1 SUBSEP $2; if (!(k in sts)) { sts[k] = 1; st[$1] = st[$1] (st[$1] ? "/" : "") $2 }
      k = $1 SUBSEP $3; if (!(k in nms)) { nms[k] = 1; nm[$1] = nm[$1] (nm[$1] ? ", " : "") $3 }
      cnt[$1]++
    }
    END {
      for (i = 1; i <= n; i++) {
        l = order[i]; s = st[l]; if (s ~ /\//) { s = (s ~ /removed/) ? "removed" : (s ~ /skipped|missing|outdated|hidden/) ? "check" : "updated" } first = s
        extra = (l == "skill" && cnt[l] > 1) ? dim "  in " cnt[l] " places" off : ""
        printf "  %s%-7s%s %s%-8s%s %s%s%s%s\n", dim, l, off, color(first), s, off, fg, nm[l], off, extra
      }
    }' "$results"
}

sync_stack

if [ "$plain" -eq 1 ]; then
  echo "SoulStack: Empryo x ProxySoul"
  phase_stack
  phase_detect
  echo
  phase_skills
  phase_agents
  phase_command
  phase_rules
  phase_presets
else
  printf '\033[?25l\n\n\n\n\n\n\n'
  label="starting"
  i=1
  while [ $i -le 20 ]; do
    case $i in
      2) label="getting SoulStack"; phase_stack ;;
      6) label="finding agents"; phase_detect ;;
      10) label="linking skills"; phase_skills ;;
      11) label="linking agents"; phase_agents ;;
      12) label="adding the soulstack command"; phase_command ;;
      14) label="writing rules"; phase_rules ;;
      17) label="adding presets"; phase_presets ;;
      20) label="done" ;;
    esac
    printf '\033[7A'
    draw $i $i "$label"
    sleep 0.06 2>/dev/null || true
    i=$((i + 1))
  done
  printf '\033[?25h'
  awk -F'|' -v dim="$c_dim" -v off="$c_off" -v fg="$c_fg" -v ok="$c_ok" -v acc="$c_acc" -v warn="$c_warn" '
    $1 == "stack" { c = ($2 == "updated" || $2 == "created") ? ok : ($2 ~ /^(outdated|offline|skipped)$/) ? warn : dim
      printf "  %sstack%s   %s%-8s%s %s%s%s  %s%s%s\n", dim, off, c, $2, off, fg, $3, off, dim, $4, off }
    $1 == "new" { printf "  %snew%s     %s%s%s\n", dim, off, fg, $3, off }' "$results"
  grep '^found|' "$results" | cut -d'|' -f3 | sed "s/^/  ${c_dim}found  ${c_off} ${c_fg}/; s/\$/${c_off}/"
  summary
fi

backed=0
if grep -q '(backed up)' "$results"; then backed=1; fi
echo
case "$mode" in
  check) printf '  %sChecked. Nothing was changed.%s\n' "$c_dim" "$c_off" ;;
  remove) printf '  %sRemoved.%s\n' "$c_dim" "$c_off" ;;
  *) printf '  %sDone.%s %sRestart your agent to load SoulStack.%s\n' "$c_ok" "$c_off" "$c_dim" "$c_off" ;;
esac
if [ "$mode" != remove ]; then
  if grep -Eq '^command[|](linked|same)[|]' "$results"; then
    printf '  %sUpdate any time with%s %ssoulstack update%s\n' "$c_dim" "$c_off" "$c_fg" "$c_off"
  else
    printf '  %sUpdate any time by running this script again.%s\n' "$c_dim" "$c_off"
  fi
fi
if [ "$backed" -eq 1 ] && [ "$mode" != check ]; then
  printf '  %sBackups end in .bak-%s next to each changed file.%s\n' "$c_dim" "$stamp" "$c_off"
fi
