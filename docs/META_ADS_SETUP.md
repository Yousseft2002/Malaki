# Connecting Meta (Instagram) Ads to the MALAKI dashboard

The **Ads** section of `/admin/analytics` reads your campaigns, spend and results from
Meta's Marketing API. It only **reads** data (`ads_read`); it can't create, change or pause ads.

You need three values, set as environment variables (in Vercel: Project → Settings →
Environment Variables; locally: `.env`):

| Variable | Example | What it is |
| --- | --- | --- |
| `META_ADS_ACCESS_TOKEN` | `EAAB…` (long) | A System User token with the `ads_read` permission |
| `META_AD_ACCOUNT_ID` | `act_1234567890` | Your ad account ID, **with** the `act_` prefix |
| `META_GRAPH_API_VERSION` | `v25.0` | Optional. Leave empty to use the version the code was written against |

Treat the token like a password: never paste it into chat, email or code.

Meta renames menu items from time to time. If a step below doesn't match exactly, look
for the closest wording.

## 1. Use a Meta Business portfolio (Business Manager)

1. Go to **business.facebook.com** and sign in with the account that owns your ads.
2. If you don't have a business portfolio yet, create one and add your ad account and
   Instagram account to it (**Business settings → Accounts → Ad accounts → Add**).

## 2. Create an app for API access (one time)

System User tokens are issued through an app owned by your business.

1. Go to **developers.facebook.com → My Apps → Create app**.
2. Choose the **Business** type (or "Other" → "Business") and connect it to your business portfolio.
3. In the app dashboard, add the **Marketing API** product.

You don't need to submit the app for review to read your own ad account.

## 3. Create a System User

1. In **Business settings → Users → System users**, click **Add**.
2. Name it, e.g. `malaki-dashboard`, and choose the **Employee** role (not Admin; the dashboard only needs to read).

## 4. Give the System User your ad account

1. Select the system user, then **Assign assets** (or **Add assets**).
2. Choose **Ad accounts**, pick your ad account, and give it the **View performance**
   permission only (also called "Analyse"/"Read-only" in some versions).
3. Save.

## 5. Generate the token

1. Still on the system user, click **Generate new token**.
2. Choose the app from step 2.
3. Token expiration: **Never** (otherwise the dashboard stops working when it expires).
4. Tick the permission **`ads_read`** (nothing else is needed).
5. Generate, then copy the token **once** into `META_ADS_ACCESS_TOKEN`. Meta won't show it again.

## 6. Find your ad account ID

Either:

- **Ads Manager**: the URL contains `act=1234567890`. Your ID is `act_1234567890`.
- **Business settings → Accounts → Ad accounts**: the ID is shown under the account name.
  Add `act_` in front of the number.

Put it in `META_AD_ACCOUNT_ID`, then redeploy (Vercel) or restart the dev server.

## 7. Check it works

Open `/admin/analytics`. The Ads section should list your campaigns with a footer
"Data from Meta, updated …". Data is cached for about an hour.

If you see an error instead, the message comes straight from Meta. Common ones:

| Message | Fix |
| --- | --- |
| `Invalid OAuth access token` | The token was copied incompletely or revoked; generate a new one (step 5). |
| `(#100) Missing permissions` / `ads_read` | Regenerate the token with `ads_read` ticked. |
| `Unsupported get request` / `does not exist` | Check `META_AD_ACCOUNT_ID` has the `act_` prefix and the system user has the ad account (step 4). |
| `Meta took longer than 8 seconds to answer` | Temporary; reload in a minute. |

## 8. Tag your ad links (so sales are credited to the right ad)

Meta reports spend; **our own database** reports which orders came from which ad. They're
matched on the campaign name, so every ad's website URL must carry UTM tags:

```
https://<your-domain>/products/the-malaki-box?utm_source=instagram&utm_medium=paid&utm_campaign=<campaign name>
```

Use **exactly** the Meta campaign name for `utm_campaign` (in Ads Manager you can use the
dynamic value `{{campaign.name}}` in the URL parameters field, so it always matches).
