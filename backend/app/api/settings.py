from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import SettingsSchema
from app.models.models import UserSettings

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("", response_model=SettingsSchema)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(UserSettings).first()
    if not settings:
        settings = UserSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return SettingsSchema(
        full_name=settings.full_name,
        role_title=settings.role_title,
        email_route=settings.email_route,
        reporting_currency=settings.reporting_currency,
        spot_rate_alerts=settings.spot_rate_alerts,
        port_congestion_alerts=settings.port_congestion_alerts,
        vessel_availability_alerts=settings.vessel_availability_alerts,
        fixture_approvals_alerts=settings.fixture_approvals_alerts,
        daily_digest_alerts=settings.daily_digest_alerts,
        sms_urgent_dispatch=settings.sms_urgent_dispatch,
        default_starting_screen=settings.default_starting_screen,
        display_density=settings.display_density,
        table_pagination_count=settings.table_pagination_count
    )

@router.put("", response_model=SettingsSchema)
def update_settings(payload: SettingsSchema, db: Session = Depends(get_db)):
    settings = db.query(UserSettings).first()
    if not settings:
        settings = UserSettings()
        db.add(settings)

    settings.full_name = payload.full_name
    settings.role_title = payload.role_title
    settings.email_route = payload.email_route
    settings.reporting_currency = payload.reporting_currency
    settings.spot_rate_alerts = payload.spot_rate_alerts
    settings.port_congestion_alerts = payload.port_congestion_alerts
    settings.vessel_availability_alerts = payload.vessel_availability_alerts
    settings.fixture_approvals_alerts = payload.fixture_approvals_alerts
    settings.daily_digest_alerts = payload.daily_digest_alerts
    settings.sms_urgent_dispatch = payload.sms_urgent_dispatch
    settings.default_starting_screen = payload.default_starting_screen
    settings.display_density = payload.display_density
    settings.table_pagination_count = payload.table_pagination_count

    db.commit()
    db.refresh(settings)

    return payload
