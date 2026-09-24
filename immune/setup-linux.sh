set -eu
echo "### $(. /etc/os-release; echo $PRETTY_NAME) shell=$(readlink -f /bin/sh)"
fail() { echo "FAIL: $*"; exit 1; }
cp -R /src /work; cd /work
export HOME=/tmp/h0; mkdir -p $HOME
out=$(sh scripts/setup.sh); echo "$out" | grep -q "no Empryo: skipping" || fail "no-empryo note"
[ -L $HOME/.agents/skills/ensoul ] || fail "skill not linked"
[ ! -e $HOME/.empryo ] || fail "empryo touched without empryo"
sh scripts/setup.sh --check | grep -q "same     ensoul" || fail "check"
export HOME=/tmp/h1; mkdir -p $HOME/.empryo $HOME/.claude $HOME/.codex $HOME/.copilot
echo '{"theme":{"name":"x"}}' > $HOME/.empryo/config.json
for f in .claude/CLAUDE.md .codex/AGENTS.md .copilot/copilot-instructions.md; do echo mine > $HOME/$f; done
sh scripts/setup.sh >/dev/null; sh scripts/setup.sh >/dev/null
for f in .claude/CLAUDE.md .codex/AGENTS.md .copilot/copilot-instructions.md; do
  head -1 $HOME/$f | grep -q mine || fail "$f overwritten"
  [ "$(grep -c soulstack:start $HOME/$f)" = 1 ] || fail "$f block count"
  ls $HOME/$f.bak-* >/dev/null 2>&1 || fail "$f no backup"
done
grep -q soulstack:start $HOME/.empryo/EMPRYO.md || fail "empryo rules"
[ "$(ls $HOME/.claude/agents/*.md | wc -l)" -eq "$(ls /work/agents/*.md | wc -l)" ] || fail "claude agents"
[ "$(ls $HOME/.copilot/agents/*.agent.md | wc -l)" -eq "$(ls /work/agents/*.md | wc -l)" ] || fail "copilot agents"
sh scripts/setup.sh --remove >/dev/null
[ "$(ls $HOME/.claude/agents 2>/dev/null | wc -l)" -eq 0 ] || fail "agents not removed"
for f in .claude/CLAUDE.md .codex/AGENTS.md .copilot/copilot-instructions.md; do ! grep -q soulstack $HOME/$f || fail "$f not removed"; grep -q mine $HOME/$f || fail "$f lost own"; done
echo "ALL OK"
