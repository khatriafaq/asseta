from sqlmodel import Field, SQLModel


class Institution(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    institution_type: str = Field(default="AMC")  # "AMC", "Bank"


class InstitutionRead(SQLModel):
    id: int
    name: str
    institution_type: str
