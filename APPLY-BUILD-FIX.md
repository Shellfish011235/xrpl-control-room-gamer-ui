# Fix Vercel build (apply on GitHub if push doesn’t work)

The build fails because `Home.tsx` has two JSX bugs. Apply the fixes **on GitHub** so the next redeploy uses the fixed code.

---

## 1. Open the file on GitHub

1. Go to: **https://github.com/Shellfish011235/xrpl-control-room-gamer-ui**
2. Open **`src/pages/Home.tsx`**
3. Click the **pencil icon** (Edit this file)

---

## 2. First fix (TabWrap closing tag)

**Find** (Ctrl+F) this block — the `</motion.div>` that is right before `{activeTab === 'governance'`:

```
                </motion.div>
              )}

              {activeTab === 'governance' && (
```

**Replace** the first line only so it says `</TabWrap>`:

```
                </TabWrap>
              )}

              {activeTab === 'governance' && (
```

(Only the `</motion.div>` → `</TabWrap>` change.)

---

## 3. Second fix (fragment + IIFE return)

**Find** this block (after the impact tab’s `)}`):

```
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Right Panel - Tools & Wallet */}
```

**Replace** with:

```
              )}
                </>
              );
              return isInAppBrowser ? tabsContent : <AnimatePresence>{tabsContent}</AnimatePresence>;
            })()}
          </motion.div>
          
          {/* Right Panel - Tools & Wallet */}
```

---

## 4. Save and redeploy

1. Scroll down, set commit message (e.g. **Fix Home.tsx JSX for Vercel build**), click **Commit changes**.
2. In Vercel, open your project → **Deployments** → **Redeploy** the latest, or wait for the automatic deploy from `main`.

The next build should pass.
