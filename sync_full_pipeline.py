"""Sync entire Holiday Intelligence pipeline to Supabase."""

import asyncio
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

sys.path.insert(0, str(Path(__file__).parent))


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

    from src.holiday_intelligence.deals.pipeline import DealHunter
    from src.holiday_intelligence.deals.models import DealSearchQuery

    hunter = DealHunter()
    all_deals = []
    all_offers = []

    destinations = ["Bangkok", "Dubai", "Singapore", "Bali", "Maldives", "Goa"]

    for dest in destinations:
        query = DealSearchQuery(destination=dest, max_results=100)
        result = await hunter.hunt(query)
        print(f"  {dest}: {result.total_found} deals, {len(result.deals_with_offers)} with offers")

        for deal_with_offer in result.deals_found:
            deal = deal_with_offer.deal
            deal_dict = {
                "deal_id": deal.deal_id,
                "title": deal.title,
                "description": deal.description,
                "deal_type": deal.deal_type.value,
                "source": deal.source.value,
                "source_url": deal.source_url,
                "destination": deal.destination,
                "origin": deal.origin,
                "original_price": float(deal.original_price) if deal.original_price else None,
                "deal_price": float(deal.deal_price) if deal.deal_price else None,
                "currency": deal.currency,
                "price_per": deal.price_per.value,
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

    # Get offers from hunter
    for offer in hunter._all_offers:
        offer_dict = {
            "offer_id": offer.offer_id,
            "title": offer.title,
            "description": offer.description,
            "source": offer.source.value,
            "source_url": offer.source_url,
            "offer_type": offer.offer_type.value,
            "discount_percent": float(offer.discount_percent) if offer.discount_percent else None,
            "discount_amount": float(offer.discount_amount) if offer.discount_amount else None,
            "cashback_amount": float(offer.cashback_amount) if offer.cashback_amount else None,
            "max_discount": float(offer.max_discount) if offer.max_discount else None,
            "min_spend": float(offer.min_spend) if offer.min_spend else None,
            "bank_name": offer.bank_name,
            "card_type": offer.card_type.value if offer.card_type else None,
            "card_variant": offer.card_variant,
            "card_network": offer.card_network.value if offer.card_network else None,
            "platforms": [p.value for p in offer.platforms],
            "deal_types": [d.value for d in offer.deal_types],
            "promo_code": offer.promo_code,
            "valid_from": offer.valid_from,
            "valid_till": offer.valid_till,
            "stackable": offer.stackable,
            "max_stack": offer.max_stack,
            "raw_data": getattr(offer, 'raw_data', {}),
            "captured_at": offer.captured_at.isoformat() if hasattr(offer, 'captured_at') else datetime.now().isoformat(),
        }
        all_offers.append(offer_dict)

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
    """Sync all data to Supabase."""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    async with httpx.AsyncClient() as client:
        # Clear existing data
        print("\n🗑️  Clearing existing data...")
        for table in ["travel_deals", "card_offers", "competitor_packages", "pipeline_summary"]:
            await client.delete(f"{SUPABASE_URL}/rest/v1/{table}", headers=headers)

        # Insert deals
        if data.get("deals"):
            print(f"\n💾 Inserting {len(data['deals'])} deals...")
            batch_size = 50
            for i in range(0, len(data["deals"]), batch_size):
                batch = data["deals"][i:i + batch_size]
                resp = await client.post(
                    f"{SUPABASE_URL}/rest/v1/travel_deals",
                    headers=headers,
                    json=batch,
                )
                if resp.status_code not in (200, 201):
                    print(f"    Error: {resp.status_code}")
                else:
                    print(f"    Batch {i//batch_size + 1} OK")

        # Insert offers
        if data.get("offers"):
            print(f"\n💳 Inserting {len(data['offers'])} offers...")
            batch_size = 50
            for i in range(0, len(data["offers"]), batch_size):
                batch = data["offers"][i:i + batch_size]
                resp = await client.post(
                    f"{SUPABASE_URL}/rest/v1/card_offers",
                    headers=headers,
                    json=batch,
                )
                if resp.status_code not in (200, 201):
                    print(f"    Error: {resp.status_code}")
                else:
                    print(f"    Batch {i//batch_size + 1} OK")

        # Insert competitor packages
        if data.get("competitor_packages"):
            print(f"\n🏢 Inserting {len(data['competitor_packages'])} competitor packages...")
            batch_size = 50
            for i in range(0, len(data["competitor_packages"]), batch_size):
                batch = data["competitor_packages"][i:i + batch_size]
                resp = await client.post(
                    f"{SUPABASE_URL}/rest/v1/competitor_packages",
                    headers=headers,
                    json=batch,
                )
                if resp.status_code not in (200, 201):
                    print(f"    Error: {resp.status_code}")
                else:
                    print(f"    Batch {i//batch_size + 1} OK")

        # Insert pipeline summary
        deals = data.get("deals", [])
        offers = data.get("offers", [])
        competitor_pkgs = data.get("competitor_packages", [])

        prices = [d["deal_price"] for d in deals if d.get("deal_price")]
        summary = {
            "summary_date": date.today().isoformat(),
            "market_signals_count": len(data.get("market_evidence", [])),
            "travel_deals_count": len(deals),
            "card_offers_count": len(offers),
            "competitor_packages_count": len(competitor_pkgs),
            "avg_deal_price": sum(prices) / len(prices) if prices else None,
            "min_deal_price": min(prices) if prices else None,
            "max_deal_price": max(prices) if prices else None,
            "top_destinations": list(set(d.get("destination") for d in deals if d.get("destination")))[:10],
            "top_sources": list(set(d.get("source") for d in deals))[:10],
        }

        print("\n📈 Inserting pipeline summary...")
        resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/pipeline_summary",
            headers=headers,
            json=[summary],
        )
        print(f"    Summary: {resp.status_code}")


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
