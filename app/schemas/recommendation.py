from pydantic import BaseModel


class RecommendationItem(BaseModel):
    product_id: int
    product_name: str
    support_count: int


class RecommendationResponse(BaseModel):
    base_product_id: int
    recommendations: list[RecommendationItem]

