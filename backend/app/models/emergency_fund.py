from sqlmodel import Field, SQLModel


class EmergencyFundConfig(SQLModel, table=True):
    __tablename__ = "emergencyfundconfig"
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True, index=True)
    target_months: int = Field(default=6)  # 3, 6, 9, or 12


class EmergencyFundConfigRead(SQLModel):
    id: int
    user_id: int
    target_months: int


class EmergencyFundConfigUpdate(SQLModel):
    target_months: int


class EmergencyFundTag(SQLModel, table=True):
    __tablename__ = "emergencyfundtag"
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    holding_id: int | None = Field(default=None, foreign_key="portfolioholding.id")
    manual_asset_id: int | None = Field(default=None, foreign_key="manualasset.id")
    # Exactly one of holding_id or manual_asset_id must be set


class EmergencyFundTagCreate(SQLModel):
    holding_id: int | None = None
    manual_asset_id: int | None = None


class EmergencyFundTagRead(SQLModel):
    id: int
    user_id: int
    holding_id: int | None
    manual_asset_id: int | None
    name: str | None = None
    current_value: float | None = None
