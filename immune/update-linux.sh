set -eu
fail() { echo "FAIL: $*"; exit 1; }
command -v git >/dev/null || { (apk add -q git || (apt-get update -qq && apt-get install -qq -y git)) >/dev/null 2>&1; }
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t; git config --global init.defaultBranch main
rm -rf /tmp/u; mkdir -p /tmp/u; cd /tmp/u
cp -R /src src; cd src; rm -rf .git; git init -q; git add .; git commit -qm "feat: first"; cd ..
git clone -q --bare src remote.git
export HOME=/tmp/u/home PATH="/tmp/u/home/.local/bin:$PATH" SOULSTACK_REPO=/tmp/u/remote.git SOULSTACK_DIR=/tmp/u/home/dev/SoulStack
mkdir -p $HOME/.local/bin
cat src/scripts/setup.sh | sh > out1; cat out1
grep -q "stack   created" out1 || fail "clone"
[ -L $HOME/.local/bin/soulstack ] || fail "command not linked"
soulstack check > out1b; grep -q "same" out1b || { cat out1b; fail "same after install"; }
cd src; sed -i 's/"version": "1.1.0"/"version": "9.9.9"/' plugin.json; echo "- new rule" >> guides/takeaways.md; git commit -qam "feat(guides): add a new rule"; git push -q ../remote.git main; cd ..
soulstack check > out2; cat out2; grep -q "outdated" out2 || fail "check did not see update"
grep -q "v9.9.9 is out" out2 || fail "check version"
soulstack update > out3; cat out3
grep -q "updated  ~/dev/SoulStack v1.1.0 to v9.9.9" out3 || fail "update line"
grep -q "new     feat(guides): add a new rule" out3 || fail "news"
cd src; git commit -q --amend -m "feat: rewritten"; git push -qf ../remote.git main; cd ..
soulstack update > out4; cat out4; grep -q "updated" out4 || fail "rewrite not handled"
git -C $SOULSTACK_DIR branch | grep -q backup- || fail "no backup branch"
echo x >> $SOULSTACK_DIR/README.md; cd src; echo remote >> README.md; git commit -qam "docs: readme"; git push -q ../remote.git main; cd ..
soulstack update > out5; grep -q "skipped" out5 || { cat out5; fail "dirty not skipped"; }
soulstack remove >/dev/null; [ ! -e $HOME/.local/bin/soulstack ] || fail "command not removed"
grep -q "local changes clash" out5 || fail "clash note"
echo "ALL OK"
