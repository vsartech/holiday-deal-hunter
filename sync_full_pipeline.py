"""Sync entire Holiday Intelligence pipeline to Supabase."""

import asyncio
import hashlib
import json
import os
import sys
from pathlib import Path
from datetime import datetime, date

import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

sys.path.insert(0, str(Path(__file__).parent / "src"))


def generate_id(text: str) -> str:
    """Generate a deterministic short ID from text."""
    return hashlib.md5(text.encode()).hexdigest()[:16]


async def sync_market_intelligence():
    """Sync market intelligence data from existing database."""
    print("\n📊 Syncing Market Intelligence...")

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    # Read existing market evidence from local DB if available
    evidence_path = Path("data/market_evidence.json")
    if evidence_path.exists():
        with open(evidence_path) as f:
            evidence = json.load(f)
        print(f"  Found {len(evidence)} market evidence records")
        return evidence

    print("  No local market evidence found, skipping")
    return []


async def sync_deals_pipeline():
    """Sync deal hunting results to Supabase."""
    print("\n💰 Syncing Deal Hunting Pipeline...")

    from holiday_intelligence.deals.pipeline import DealHunter, get_deal_adapter
    from holiday_intelligence.deals.models import DealSearchQuery

    hunter = DealHunter()
    all_deals = []
    all_offers = []

    destinations = ["Bangkok", "Dubai", "Singapore", "Bali", "Maldives", "Goa"]

    # Collect offers from all adapters first
    query = DealSearchQuery(destination="Bangkok", max_results=1)
    for adapter_name in hunter._adapter_names:
        try:
            adapter = get_deal_adapter(adapter_name)
            offers = await adapter.search_offers(query)
            for offer in offers:
                offer_dict = {
                    "offer_id": offer.offer_id,
                    "title": offer.title,
                    "description": offer.description,
                    "source": offer.source.value if hasattr(offer.source, 'value') else offer.source,
                    "source_url": offer.source_url,
                    "offer_type": offer.offer_type.value if hasattr(offer.offer_type, 'value') else offer.offer_type,
                    "discount_percent": float(offer.discount_percent) if offer.discount_percent else None,
                    "discount_amount": float(offer.discount_amount) if offer.discount_amount else None,
                    "cashback_amount": float(offer.cashback_amount) if offer.cashback_amount else None,
                    "max_discount": float(offer.max_discount) if offer.max_discount else None,
                    "min_spend": float(offer.min_spend) if offer.min_spend else None,
                    "bank_name": offer.bank_name,
                    "card_type": offer.card_type.value if offer.card_type and hasattr(offer.card_type, 'value') else offer.card_type,
                    "card_variant": offer.card_variant,
                    "card_network": offer.card_network.value if offer.card_network and hasattr(offer.card_network, 'value') else offer.card_network,
                    "platforms": [p.value if hasattr(p, 'value') else p for p in offer.platforms],
                    "deal_types": [d.value if hasattr(d, 'value') else d for d in offer.deal_types],
                    "promo_code": offer.promo_code,
                    "valid_from": offer.valid_from,
                    "valid_till": offer.valid_till,
                    "stackable": offer.stackable,
                    "max_stack": offer.max_stack,
                    "raw_data": getattr(offer, 'raw_data', {}),
                    "captured_at": offer.captured_at.isoformat() if hasattr(offer, 'captured_at') else datetime.now().isoformat(),
                }
                all_offers.append(offer_dict)
            await adapter.close()
        except Exception as e:
            print(f"  Warning: {adapter_name} offers failed: {e}")

    # Collect deals from all destinations
    for dest in destinations:
        query = DealSearchQuery(destination=dest, max_results=100)
        result = await hunter.hunt(query)
        print(f"  {dest}: {result.deals_found} deals, {result.deals_with_offers} with offers")

        for deal_with_offer in result.all_deals:
            deal = deal_with_offer.deal
            deal_dict = {
                "deal_id": deal.deal_id,
                "title": deal.title,
                "description": deal.description,
                "deal_type": deal.deal_type.value if hasattr(deal.deal_type, 'value') else deal.deal_type,
                "source": deal.source.value if hasattr(deal.source, 'value') else deal.source,
                "source_url": deal.source_url,
                "destination": deal.destination,
                "origin": deal.origin,
                "original_price": float(deal.original_price) if deal.original_price else None,
                "deal_price": float(deal.deal_price) if deal.deal_price else None,
                "currency": deal.currency,
                "price_per": deal.price_per.value if hasattr(deal.price_per, 'value') else deal.price_per,
                "duration_nights": deal.duration_nights,
                "duration_days": deal.duration_days,
                "travel_date": deal.travel_date,
                "valid_till": deal.valid_till,
                "inclusions": deal.inclusions,
                "hotel_name": deal.hotel_name,
                "hotel_rating": float(deal.hotel_rating) if deal.hotel_rating else None,
                "airline": deal.airline,
                "promo_codes": deal.promo_codes,
                "raw_data": getattr(deal, 'raw_data', {}),
                "captured_at": deal.captured_at.isoformat() if hasattr(deal, 'captured_at') else datetime.now().isoformat(),
            }
            all_deals.append(deal_dict)

    print(f"\n  Total: {len(all_deals)} deals, {len(all_offers)} offers")
    return all_deals, all_offers


async def sync_competitor_packages():
    """Sync competitor intelligence data."""
    print("\n🏢 Syncing Competitor Packages...")

    # Check for existing competitor data
    competitor_path = Path("data/competitor_packages.json")
    if competitor_path.exists():
        with open(competitor_path) as f:
            packages = json.load(f)
        print(f"  Found {len(packages)} competitor packages")
        return packages

    print("  No competitor packages found, skipping")
    return []


async def sync_to_supabase(data: dict):
    """Sync all data to Supabase using upserts."""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    async with httpx.AsyncClient() as client:
        # Deduplicate deals by deal_id or title+source
        deals = data.get("deals", [])
        seen_deal_ids = set()
        unique_deals = []
        for d in deals:
            # Generate deal_id if missing
            if not d.get("deal_id"):
                key = f"{d.get('title', '')}|{d.get('source', '')}|{d.get('destination', '')}"
                d["deal_id"] = generate_id(key)
            did = d["deal_id"]
            if did not in seen_deal_ids:
                seen_deal_ids.add(did)
                unique_deals.append(d)
        print(f"\n📊 Deduplicated deals: {len(deals)} → {len(unique_deals)}")

        # Deduplicate offers by offer_id or title+source
        offers = data.get("offers", [])
        seen_offer_ids = set()
        unique_offers = []
        for o in offers:
            # Generate offer_id if missing
            if not o.get("offer_id"):
                key = f"{o.get('title', '')}|{o.get('source', '')}|{o.get('promo_code', '')}"
                o["offer_id"] = generate_id(key)
            oid = o["offer_id"]
            if oid not in seen_offer_ids:
                seen_offer_ids.add(oid)
                unique_offers.append(o)
        print(f"📊 Deduplicated offers: {len(offers)} → {len(unique_offers)}")

        # Upsert deals
        if unique_deals:
            print(f"\n💾 Upserting {len(unique_deals)} deals...")
            batch_size = 50
            success = 0
            for i in range(0, len(unique_deals), batch_size):
                batch = unique_deals[i:i + batch_size]
                resp = await client.post(
                    f"{SUPABASE_URL}/rest/v1/travel_deals",
                    headers=headers,
                    json=batch,
                )
                if resp.status_code in (200, 201, 204):
                    success += len(batch)
                else:
                    print(f"    Batch {i//batch_size + 1} error: {resp.status_code} {resp.text[:100]}")
            print(f"    Upserted {success} deals")

        # Upsert offers
        if unique_offers:
            print(f"\n💳 Upserting {len(unique_offers)} offers...")
            batch_size = 50
            success = 0
            for i in range(0, len(unique_offers), batch_size):
                batch = unique_offers[i:i + batch_size]
                resp = await client.post(
                    f"{SUPABASE_URL}/rest/v1/card_offers",
                    headers=headers,
                    json=batch,
                )
                if resp.status_code in (200, 201, 204):
                    success += len(batch)
                else:
                    print(f"    Batch {i//batch_size + 1} error: {resp.status_code} {resp.text[:100]}")
            print(f"    Upserted {success} offers")

        # Try competitor_packages (may not exist)
        competitor_pkgs = data.get("competitor_packages", [])
        if competitor_pkgs:
            print(f"\n🏢 Upserting {len(competitor_pkgs)} competitor packages...")
            resp = await client.post(
                f"{SUPABASE_URL}/rest/v1/competitor_packages",
                headers=headers,
                json=competitor_pkgs[:50],
            )
            if resp.status_code == 404:
                print("    Table not found, skipping")
            else:
                print(f"    Status: {resp.status_code}")

        # Try pipeline_summary (may not exist)
        prices = [d["deal_price"] for d in unique_deals if d.get("deal_price")]
        summary = {
            "summary_date": date.today().isoformat(),
            "market_signals_count": len(data.get("market_evidence", [])),
            "travel_deals_count": len(unique_deals),
            "card_offers_count": len(unique_offers),
            "competitor_packages_count": len(competitor_pkgs),
            "avg_deal_price": round(sum(prices) / len(prices), 2) if prices else None,
            "min_deal_price": min(prices) if prices else None,
            "max_deal_price": max(prices) if prices else None,
            "top_destinations": list(set(d.get("destination") for d in unique_deals if d.get("destination")))[:10],
            "top_sources": list(set(d.get("source") for d in unique_deals))[:10],
        }

        print("\n📈 Upserting pipeline summary...")
        resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/pipeline_summary",
            headers={**headers, "Prefer": "resolution=merge-duplicates,return=minimal"},
            json=[summary],
        )
        if resp.status_code == 404:
            print("    Table not found, skipping")
        else:
            print(f"    Status: {resp.status_code}")


async def main():
    print("=" * 60)
    print("🚀 Full Pipeline Sync to Supabase")
    print("=" * 60)

    # Sync all pipeline stages
    market_evidence = await sync_market_intelligence()
    deals, offers = await sync_deals_pipeline()
    competitor_packages = await sync_competitor_packages()

    # Combine and sync
    data = {
        "market_evidence": market_evidence,
        "deals": deals,
        "offers": offers,
        "competitor_packages": competitor_packages,
    }

    await sync_to_supabase(data)

    print("\n" + "=" * 60)
    print("✅ SYNC COMPLETE")
    print("=" * 60)
    print(f"  Market Evidence: {len(market_evidence)}")
    print(f"  Travel Deals: {len(deals)}")
    print(f"  Card Offers: {len(offers)}")
    print(f"  Competitor Packages: {len(competitor_packages)}")
    print(f"\n🌐 View at: https://holiday-deal-hunter.vercel.app")


if __name__ == "__main__":
    asyncio.run(main())
