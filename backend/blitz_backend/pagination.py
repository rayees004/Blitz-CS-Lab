"""
Opt-in pagination shared by list endpoints.

When the request has ?page=N, only that page of items is returned (default 20 per page,
override with ?page_size=, max 100) along with page metadata. Without ?page the full list is
returned, so dropdowns/pickers that need every item keep working.
"""
import math

PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


def _to_int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def paginate(request, items):
    """
    Returns (page_items, meta). `items` may be a queryset or a list.
    meta always has 'count'; when paginated it also has page, page_size, total_pages,
    has_next and has_previous. Spread meta into the response next to 'results'.
    """
    count = items.count() if hasattr(items, 'count') and not isinstance(items, list) else len(items)
    if 'page' not in request.query_params:
        return items, {'count': count}

    page_size = min(max(_to_int(request.query_params.get('page_size'), PAGE_SIZE), 1), MAX_PAGE_SIZE)
    total_pages = max(math.ceil(count / page_size), 1)
    page = min(max(_to_int(request.query_params.get('page'), 1), 1), total_pages)
    start = (page - 1) * page_size

    return items[start:start + page_size], {
        'count': count,
        'page': page,
        'page_size': page_size,
        'total_pages': total_pages,
        'has_next': page < total_pages,
        'has_previous': page > 1,
    }
